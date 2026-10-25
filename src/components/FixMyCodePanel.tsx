import React, { useState } from 'react';
import { ErrorDiagnosis } from '../types';
import { Check, Copy, Wrench, AlertCircle, FileCode, ArrowRight } from 'lucide-react';

interface FixMyCodePanelProps {
  diagnosis: ErrorDiagnosis;
}

export const FixMyCodePanel: React.FC<FixMyCodePanelProps> = ({ diagnosis }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [viewMode, setViewMode] = useState<'corrected' | 'comparison'>('corrected');

  const handleCopyCode = () => {
    if (!diagnosis.correctedCode) return;
    navigator.clipboard.writeText(diagnosis.correctedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyNotes = () => {
    const text = `Error: ${diagnosis.title}\nCategory: ${diagnosis.category}\n\nExplanation:\n${diagnosis.explanation}\n\nCause:\n${diagnosis.likelyCause}\n\nSteps:\n${diagnosis.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nSuggested Code:\n${diagnosis.correctedCode || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  if (!diagnosis.correctedCode) {
    return (
      <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 text-amber-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <h2 className="text-sm font-semibold text-white">Suggested Correction Unavailable</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {diagnosis.confidenceNote ||
            'There was insufficient context to generate a confident code correction without guessing missing dependencies or logic.'}
        </p>
        <div className="p-3 rounded-lg bg-[#0c101c] border border-slate-800 text-xs text-slate-400">
          Follow the step-by-step debugging instructions in the guide below to resolve the error safely in your local environment.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Suggested Fix</h2>
            <p className="text-[11px] text-slate-400">
              Preserves intended behavior with minimal changes
            </p>
          </div>
        </div>

        {/* View mode toggle & Copy buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {diagnosis.inputCode && (
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('corrected')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'corrected'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fixed Code
              </button>
              <button
                type="button"
                onClick={() => setViewMode('comparison')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'comparison'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Compare Original
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyNotes}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1"
          >
            {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNotes ? 'Copied Notes' : 'Copy Explanation'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Display */}
      {viewMode === 'comparison' && diagnosis.inputCode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Original */}
          <div className="rounded-lg border border-slate-800 bg-[#0c101c] overflow-hidden">
            <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              Original Code (Error)
            </div>
            <pre className="p-3 text-xs font-mono text-rose-300/90 overflow-x-auto leading-relaxed max-h-72">
              <code>{diagnosis.inputCode}</code>
            </pre>
          </div>

          {/* Corrected */}
          <div className="rounded-lg border border-emerald-900/60 bg-[#0c101c] overflow-hidden">
            <div className="px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-900/60 text-[11px] font-mono text-emerald-400">
              Suggested Fix
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-72">
              <code>{diagnosis.correctedCode}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-[#0c101c] overflow-hidden">
          <div className="px-3.5 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>solution.{diagnosis.language}</span>
            </span>
            <span className="text-[11px] text-slate-500">Static AI Recommendation</span>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-80">
            <code>{diagnosis.correctedCode}</code>
          </pre>
        </div>
      )}

      {/* Changes list */}
      {diagnosis.changes && diagnosis.changes.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-slate-300 block">
            What was changed and why:
          </span>
          <div className="space-y-1.5">
            {diagnosis.changes.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5"
              >
                <div className="font-mono text-cyan-300 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                  <span>{item.change}</span>
                </div>
                <div className="text-slate-400 text-[11px] sm:text-right">
                  {item.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-2.5 rounded-lg bg-[#0c101c] border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 flex-shrink-0"></span>
        <span>
          <strong>Notice:</strong> This suggested correction is generated via static semantic analysis and has not been executed in an isolated runtime sandbox.
        </span>
      </div>
    </div>
  );
};
