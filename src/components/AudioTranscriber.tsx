import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles, AlertCircle, ArrowDownRight, Check, X, Upload } from 'lucide-react';
import { ApiService } from '../services/api';

interface AudioTranscriberProps {
  onInsertToError: (text: string) => void;
  onInsertToCode: (text: string) => void;
  onInsertToContext: (text: string) => void;
  isCompact?: boolean;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  onInsertToError,
  onInsertToCode,
  onInsertToContext,
  isCompact = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const handleTranscribeBlob = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setErrorMsg(null);
    try {
      const text = await ApiService.transcribeAudio(audioBlob);
      if (!text || text.trim().length === 0) {
        setTranscribedText('(Audio was transcribed, but no spoken words were detected)');
      } else {
        setTranscribedText(text);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscribedText(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Microphone recording is not supported in this browser. Please use the Upload Audio option.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all audio tracks to release microphone hardware
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size === 0) {
          setErrorMsg('No audio data captured. Please try speaking again.');
          setIsTranscribing(false);
          return;
        }

        handleTranscribeBlob(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      // Gracefully handle permission denied without throwing or logging an uncaught error
      setIsRecording(false);
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        String(err?.message || '').toLowerCase().includes('denied');

      if (isDenied) {
        setErrorMsg('Microphone access was denied. You can enable microphone permissions in your browser, or upload an audio recording below.');
      } else {
        setErrorMsg(`Microphone unavailable (${err?.name || 'Error'}). You can upload an audio file instead.`);
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/i)) {
      setErrorMsg('Please select a valid audio file (WAV, MP3, WebM, OGG, M4A).');
      return;
    }

    handleTranscribeBlob(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRoute = (target: 'error' | 'code' | 'context') => {
    if (!transcribedText) return;
    if (target === 'error') {
      onInsertToError(transcribedText);
      setCopiedTarget('error');
    } else if (target === 'code') {
      onInsertToCode(transcribedText);
      setCopiedTarget('code');
    } else {
      onInsertToContext(transcribedText);
      setCopiedTarget('context');
    }
    setTimeout(() => setCopiedTarget(null), 2000);
  };

  return (
    <div className="bg-[#0c101c] border border-slate-800 rounded-xl p-3 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-violet-400">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">
              Voice Dictation (Gemini 3.5 Transcribe)
            </span>
            <span className="text-[10px] text-slate-500 block">
              Record spoken thoughts, error traces, or code to transcribe
            </span>
          </div>
        </div>

        {/* Record, Stop, and Upload Fallback Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isTranscribing}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Upload audio file to transcribe"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop ({recordSeconds}s)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="px-3 py-1 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Record Mic</span>
            </button>
          )}
        </div>
      </div>

      {/* Recording Waveform / Timer Bar */}
      {isRecording && (
        <div className="p-2 rounded bg-rose-950/30 border border-rose-900/60 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Recording audio via microphone... Speak clearly.</span>
          </div>
          <span className="font-mono tabular-nums font-semibold">{recordSeconds}s</span>
        </div>
      )}

      {/* Transcribing State */}
      {isTranscribing && (
        <div className="p-2 rounded bg-violet-950/30 border border-violet-900/60 flex items-center gap-2 text-xs text-violet-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
          <span>Transcribing audio using gemini-3.5-transcribe...</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Transcribed Result & Routing Buttons */}
      {transcribedText && (
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-medium text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Transcribed Text:</span>
            </span>
            <button
              type="button"
              onClick={() => setTranscribedText(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <p className="text-slate-200 font-mono text-[11px] leading-relaxed bg-[#0c101c] p-2 rounded border border-slate-800/80 max-h-28 overflow-y-auto">
            {transcribedText}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-500 mr-1">Insert into:</span>
            <button
              type="button"
              onClick={() => handleRoute('error')}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 flex items-center gap-1 transition-colors"
            >
              {copiedTarget === 'error' ? <Check className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>Error Trace</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoute('code')}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 flex items-center gap-1 transition-colors"
            >
              {copiedTarget === 'code' ? <Check className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>Code Editor</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoute('context')}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-violet-950/50 hover:bg-violet-900/60 border border-violet-800/60 text-violet-300 flex items-center gap-1 transition-colors"
            >
              {copiedTarget === 'context' ? <Check className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>Context</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
