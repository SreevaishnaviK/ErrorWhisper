import { ErrorDiagnosis, SupportedLanguage, PracticeQuestion } from '../types';

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

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch (_) {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    return await res.json();
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

    if (!res.ok) {
      let errorMsg = 'Failed to generate practice question';
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return await res.json();
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

    if (!res.ok) {
      let errorMsg = 'Failed to transcribe audio';
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const json = await res.json();
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

    if (!res.ok) {
      let errorMsg = 'Failed to get response from AI tutor';
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return await res.json();
  }
}

