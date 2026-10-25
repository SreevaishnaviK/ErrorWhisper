import React from 'react';
import { Terminal, Shield, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { SAMPLE_ERRORS } from '../data/samples';
import { SampleError } from '../types';

interface EmptyOrLoadingStateProps {
  isLoading: boolean;
  onSelectSample: (sample: SampleError) => void;
}

export const EmptyOrLoadingState: React.FC<EmptyOrLoadingStateProps> = ({
  isLoading,
  onSelectSample,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#121826] border border-slate-800 rounded-xl p-8 sm:p-12 shadow-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[460px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 animate-spin">
            <div className="w-full h-full bg-[#0c101c] rounded-xl" />
          </div>
          <Terminal className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Analyzing Error with Gemini...
          </h2>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Parsing compiler diagnostics, inspecting language syntax semantics, identifying the root cause, and preparing your beginner-friendly explanation.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 pt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Checking stack trace & variable bindings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center space-y-6 min-h-[460px] justify-center">
      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-sm">
        <Sparkles className="w-6 h-6 text-cyan-400" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Your error is trying to tell you something.
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Paste your code and error message on the left, then click <strong>Analyze Error</strong>.
          Understand what went wrong, fix it, and learn why.
        </p>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left">
        <div className="p-3 rounded-lg bg-[#0c101c] border border-slate-800">
          <BookOpen className="w-4 h-4 text-violet-400 mb-1.5" />
          <h3 className="text-xs font-semibold text-slate-200">Plain English</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Zero condescension, clear analogies, and jargon explained.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#0c101c] border border-slate-800">
          <Terminal className="w-4 h-4 text-cyan-400 mb-1.5" />
          <h3 className="text-xs font-semibold text-slate-200">Targeted Fix</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Minimal, surgical changes that preserve your intent.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#0c101c] border border-slate-800">
          <Shield className="w-4 h-4 text-emerald-400 mb-1.5" />
          <h3 className="text-xs font-semibold text-slate-200">Concept Quiz</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Interactive practice question to test your knowledge.
          </p>
        </div>
      </div>

      {/* Quick Sample Links */}
      <div className="w-full max-w-lg pt-2 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 block mb-2 font-medium">
          Or load one of these common student lab errors:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {SAMPLE_ERRORS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSample(s)}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>{s.label}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
