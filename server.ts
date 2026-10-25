import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

import {
  handleHealth,
  handleAnalyzeError,
  handlePracticeQuestion,
  handleTranscribe,
  handleChat,
} from './api/_handlers.ts';

// Health checks for Cloud Run and container orchestration
app.get('/health', handleHealth);
app.get('/api/health', handleHealth);

// API Routes
app.post('/api/analyze-error', handleAnalyzeError);
app.post('/api/practice-question', handlePracticeQuestion);
app.post('/api/transcribe', handleTranscribe);
app.post('/api/chat', handleChat);

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.PORT);
  const isProduction = process.env.NODE_ENV === 'production' || (hasDist && isCloudRun) || hasDist;

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[ErrorWhisper] Running in development mode with Vite middleware');
    } catch (viteErr) {
      console.warn('[ErrorWhisper] Vite dev server failed to initialize, falling back to static/API mode:', viteErr);
      if (hasDist) {
        app.use(express.static(distDir));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(indexHtmlPath);
        });
      }
    }
  } else {
    console.log(`[ErrorWhisper] Running in production mode, serving pre-built assets from ${distDir}`);
    app.use(express.static(distDir));

    // API catch-all 404 handler to prevent returning HTML index for missing API endpoints
    app.all('/api/*', (_req: Request, res: Response) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });

    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(503).send('Application build in progress or dist/index.html not found. Please run npm run build.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ErrorWhisper] Server listening on http://0.0.0.0:${PORT} (PID: ${process.pid}, NODE_ENV: ${process.env.NODE_ENV || (isProduction ? 'production' : 'development')})`);
  });

  server.on('error', (err: any) => {
    console.error('[ErrorWhisper] Fatal server listener error:', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('[ErrorWhisper] Received SIGTERM signal, closing HTTP server gracefully...');
    server.close(() => {
      console.log('[ErrorWhisper] HTTP server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[ErrorWhisper] Received SIGINT signal, closing HTTP server gracefully...');
    server.close(() => {
      console.log('[ErrorWhisper] HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('[ErrorWhisper] Fatal startup error:', err);
  process.exit(1);
});
