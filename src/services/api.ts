import { ErrorDiagnosis, SupportedLanguage, PracticeQuestion } from '../types';

/**
 * Safely consumes a fetch Response body exactly once.
 * Reads text once, parses JSON when valid, and safely handles HTML/non-JSON error
 * responses without ever reading the body stream twice.
 */
async function parseResponseBody<T>(res: Response, fallbackErrorMessage: string): Promise<T> {
  // Read body stream exactly once
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (readErr: any) {
    throw new Error(`Unable to read server response: ${readErr?.message || 'Network stream error'}`);
  }

  // Attempt to parse JSON once from the read text
  let data: any = null;
  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch {
      // Body is not JSON (e.g., HTML 404/500 error page or plain text)
      data = null;
    }
  }

  // Handle non-2xx HTTP responses
  if (!res.ok) {
    let errorMsg = '';

    // 1. Check if the server returned a JSON error object
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string' && data.error.trim().length > 0) {
        errorMsg = data.error.trim();
      } else if (typeof data.message === 'string' && data.message.trim().length > 0) {
        errorMsg = data.message.trim();
      }
    }

    // 2. Check if the server returned a short plain-text error message (filter out HTML/DOCTYPE pages)
    if (!errorMsg && rawText) {
      const trimmed = rawText.trim();
      const isHtml =
        trimmed.startsWith('<') ||
        trimmed.toLowerCase().includes('<!doctype') ||
        trimmed.toLowerCase().includes('<html');

      if (!isHtml && trimmed.length > 0 && trimmed.length <= 400) {
        errorMsg = trimmed;
      }
    }

    // 3. Fallback based on HTTP status code with clear, user-facing context
    if (!errorMsg) {
      switch (res.status) {
        case 400:
          errorMsg = 'Bad request. Please verify your input and try again.';
          break;
        case 401:
        case 403:
          errorMsg = 'Permission denied. Please verify your API key or server authentication.';
          break;
        case 404:
          errorMsg = 'API endpoint not found (404). Please ensure the backend or Vercel serverless functions are deployed.';
          break;
        case 413:
          errorMsg = 'Payload too large. Please shorten your code snippet or error trace.';
          break;
        case 429:
          errorMsg = 'Rate limit exceeded. Please wait a moment before trying again.';
          break;
        case 500:
          errorMsg = 'Server error (500). Please check server logs and verify that GEMINI_API_KEY is configured in your deployment environment.';
          break;
        case 502:
        case 503:
        case 504:
          errorMsg = `Service temporarily unavailable (${res.status}). The server or AI model timed out, please retry.`;
          break;
        default:
          errorMsg = `${fallbackErrorMessage} (${res.status} ${res.statusText || 'Error'})`;
          break;
      }
    }

    throw new Error(errorMsg);
  }

  // If status is 2xx OK but data is null (e.g. empty response or HTML received on a 200 rewrite)
  if (data === null) {
    if (!rawText || rawText.trim().length === 0) {
      return {} as T;
    }
    const isHtml =
      rawText.startsWith('<') ||
      rawText.toLowerCase().includes('<!doctype') ||
      rawText.toLowerCase().includes('<html');
    if (isHtml) {
      throw new Error('Received HTML page instead of JSON API response. Verify that your API route is deployed on Vercel.');
    }
    throw new Error('Received non-JSON response from server.');
  }

  return data as T;
}

export class ApiService {
  public static async analyzeError(
    language: SupportedLanguage,
    code: string,
    errorText: string,
    context?: string
  ): Promise<ErrorDiagnosis> {
    const res = await fetch('/api/analyze-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        code,
        errorText,
        context,
      }),
    });

    return await parseResponseBody<ErrorDiagnosis>(res, 'Failed to analyze error');
  }

  public static async fetchPracticeQuestion(
    language: SupportedLanguage,
    category: string,
    concept: string
  ): Promise<PracticeQuestion> {
    const res = await fetch('/api/practice-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        category,
        concept,
      }),
    });

    return await parseResponseBody<PracticeQuestion>(res, 'Failed to generate practice question');
  }

  public static async transcribeAudio(audioBlob: Blob): Promise<string> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64: base64Data,
        mimeType: audioBlob.type || 'audio/webm',
      }),
    });

    const json = await parseResponseBody<{ transcription?: string }>(res, 'Failed to transcribe audio');
    return json.transcription || '';
  }

  public static async sendChatMessage(
    messages: { role: 'user' | 'model'; content: string }[],
    rolePreset: string,
    complexity: string,
    context?: { language?: string; currentCode?: string; currentError?: string }
  ): Promise<{ role: 'model'; content: string; modelUsed: string; rolePreset: string }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        rolePreset,
        complexity,
        context,
      }),
    });

    return await parseResponseBody<{
      role: 'model';
      content: string;
      modelUsed: string;
      rolePreset: string;
    }>(res, 'Failed to get response from AI tutor');
  }
}

