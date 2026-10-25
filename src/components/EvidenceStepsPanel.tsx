import React from 'react';
import { ErrorDiagnosis } from '../types';
import { Search, ListOrdered, MapPin, ShieldAlert } from 'lucide-react';

interface EvidenceStepsPanelProps {
  diagnosis: ErrorDiagnosis;
}

export const EvidenceStepsPanel: React.FC<EvidenceStepsPanelProps> = ({ diagnosis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Evidence and Code Location */}
      <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Search className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-white">Observed Evidence</h2>
        </div>

        {/* Location Note if available */}
        {diagnosis.location && (diagnosis.location.line !== null || diagnosis.location.note) && (
          <div className="p-2.5 rounded-lg bg-[#0c101c] border border-slate-800 text-xs flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-slate-300">
              {diagnosis.location.line !== null && (
                <strong className="text-white font-mono mr-1.5 tabular-nums">
                  Line {diagnosis.location.line}{diagnosis.location.column ? `:${diagnosis.location.column}` : ''}:
                </strong>
              )}
              {diagnosis.location.note}
            </span>
          </div>
        )}

        {/* Evidence Snippets */}
        <div className="space-y-2 flex-grow">
          {diagnosis.evidence && diagnosis.evidence.length > 0 ? (
            diagnosis.evidence.map((ev, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0c101c] border border-slate-800/80 text-xs space-y-1">
                <code className="text-rose-300 font-mono text-[11px] block bg-slate-900/80 p-1.5 rounded border border-slate-800 overflow-x-auto">
                  {ev.text}
                </code>
                <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                  {ev.explanation}
                </p>
              </div>
            ))
          ) : (
            <div className="p-3 bg-[#0c101c] rounded-lg border border-slate-800 text-xs text-slate-500 italic">
              No specific isolated code/error tokens cited.
            </div>
          )}
        </div>

        {/* Confidence note */}
        {diagnosis.confidenceNote && (
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <strong className="text-slate-300">Confidence check: </strong>
            <span>{diagnosis.confidenceNote}</span>
          </div>
        )}
      </div>

      {/* Step by Step Debugging Instructions */}
      <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-3">
        <div className="flex items-center gap-2 text-violet-400">
          <ListOrdered className="w-4 h-4" />
          <h2 className="text-sm font-semibold text-white">Step-by-Step Debugging Guide</h2>
        </div>

        <p className="text-xs text-slate-400">
          Execute these steps sequentially in your editor or terminal:
        </p>

        <ol className="space-y-2.5 flex-grow">
          {diagnosis.steps && diagnosis.steps.length > 0 ? (
            diagnosis.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="w-5 h-5 rounded-full bg-violet-950/80 border border-violet-800 text-violet-300 font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 tabular-nums">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-500 italic">No explicit sequential steps provided.</li>
          )}
        </ol>
      </div>
    </div>
  );
};
