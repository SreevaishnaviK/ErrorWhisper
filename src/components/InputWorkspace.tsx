import React, { useMemo } from 'react';
import { SupportedLanguage, SampleError } from '../types';
import { SAMPLE_ERRORS } from '../data/samples';
import { Play, RotateCcw, Code2, Bug, HelpCircle, Sparkles, AlertCircle } from 'lucide-react';
import { AudioTranscriber } from './AudioTranscriber';

interface InputWorkspaceProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  code: string;
  setCode: (c: string) => void;
  errorText: string;
  setErrorText: (e: string) => void;
  context: string;
  setContext: (ctx: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onSelectSample: (sample: SampleError) => void;
  isLoading: boolean;
  validationError: string | null;
}

const LANGUAGES: { id: SupportedLanguage; name: string }[] = [
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'javascript', name: 'JavaScript' },
];

export const InputWorkspace: React.FC<InputWorkspaceProps> = ({
  language,
  setLanguage,
  code,
  setCode,
  errorText,
  setErrorText,
  context,
  setContext,
  onAnalyze,
  onClear,
  onSelectSample,
  isLoading,
  validationError,
}) => {
  // Generate line numbers for the code textarea
  const lineNumbers = useMemo(() => {
    const lines = code.split('\n').length;
    return Array.from({ length: Math.max(lines, 8) }, (_, i) => i + 1);
  }, [code]);

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Top Section: Title & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Code & Error Workspace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select language and paste the code with its compiler message or runtime exception.
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 self-start sm:self-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLanguage(l.id)}
              disabled={isLoading}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
                language === l.id
                  ? 'bg-violet-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Sample Selector Bar */}
      <div className="flex items-center flex-wrap gap-1.5 py-1">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Samples:</span>
        </span>
        {SAMPLE_ERRORS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectSample(s)}
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title={`${s.language.toUpperCase()}: ${s.description}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Voice Dictation (Gemini 3.5 Transcribe) */}
      <AudioTranscriber
        onInsertToError={(text) => setErrorText(errorText ? `${errorText}\n${text}` : text)}
        onInsertToCode={(text) => setCode(code ? `${code}\n${text}` : text)}
        onInsertToContext={(text) => setContext(context ? `${context} ${text}` : text)}
      />

      {/* Code Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
          <label className="font-medium text-slate-300 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Source Code ({LANGUAGES.find((l) => l.id === language)?.name})</span>
          </label>
          <span className="font-mono tabular-nums text-slate-500">
            {code.length} chars · {code.split('\n').filter(Boolean).length} lines
          </span>
        </div>

        <div className="relative flex rounded-lg border border-slate-800 bg-[#0c101c] focus-within:border-cyan-500/80 transition-colors overflow-hidden">
          {/* Gutter Line Numbers */}
          <div className="hidden sm:block select-none py-3 px-2 bg-slate-900/60 border-r border-slate-800/60 text-right font-mono text-[11px] text-slate-600 leading-relaxed min-w-[2.5rem]">
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            placeholder={`// Paste your ${language} source code here...`}
            rows={8}
            className="w-full p-3 bg-transparent text-xs text-slate-200 font-mono focus:outline-none resize-y placeholder-slate-600 leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Error Message Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
          <label className="font-medium text-slate-300 flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Error Message, Compiler Diagnostic or Stack Trace</span>
          </label>
          <span className="font-mono tabular-nums text-slate-500">
            {errorText.length} chars
          </span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0c101c] focus-within:border-rose-500/80 transition-colors">
          <textarea
            value={errorText}
            onChange={(e) => setErrorText(e.target.value)}
            disabled={isLoading}
            placeholder="Paste the compiler diagnostic, terminal traceback, or exception output..."
            rows={5}
            className="w-full p-3 bg-transparent text-xs text-rose-200/90 font-mono focus:outline-none resize-y placeholder-slate-600 leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Optional Context Field */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Optional Context (Lab assignment, compiler flags, what you were trying to do)</span>
          </span>
        </label>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={isLoading}
          placeholder="e.g. CS101 homework 2 - calculating array average"
          className="w-full px-3 py-2 bg-[#0c101c] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onClear}
          disabled={isLoading || (!code && !errorText && !context)}
          className="px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all shadow-md shadow-violet-900/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Error...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Analyze Error</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
