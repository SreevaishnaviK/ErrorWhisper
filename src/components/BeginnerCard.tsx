import React, { useState } from 'react';
import { ErrorDiagnosis } from '../types';
import { Lightbulb, ChevronDown, ChevronUp, Cpu, Compass, HelpCircle } from 'lucide-react';

interface BeginnerCardProps {
  diagnosis: ErrorDiagnosis;
}

export const BeginnerCard: React.FC<BeginnerCardProps> = ({ diagnosis }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-violet-400">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Explain Like I'm a Beginner</h2>
          <p className="text-xs text-slate-400">Plain English translation without jargon</p>
        </div>
      </div>

      {/* Plain English explanation */}
      <div className="p-4 rounded-lg bg-[#0c101c] border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3">
        <p className="font-sans">{diagnosis.explanation}</p>

        {diagnosis.likelyCause && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-cyan-400 block mb-1">
              Why did it probably happen?
            </span>
            <p className="text-xs text-slate-300">{diagnosis.likelyCause}</p>
          </div>
        )}
      </div>

      {/* Prevention Tip / Concept to remember */}
      {diagnosis.preventionTip && (
        <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2">
          <Compass className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-cyan-200">Concept to remember: </strong>
            <span>{diagnosis.preventionTip}</span>
          </div>
        </div>
      )}

      {/* Technical Deep Dive (Collapsible) */}
      {diagnosis.technicalDetail && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center justify-between w-full py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>More technical detail (Under the hood)</span>
            </span>
            {showTechnical ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showTechnical && (
            <div className="mt-2.5 p-3 rounded-lg bg-[#0c101c] border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
              {diagnosis.technicalDetail}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
