import React from 'react';
import { ErrorDiagnosis } from '../types';
import { AlertCircle, AlertTriangle, Info, Clock, MessageSquare } from 'lucide-react';

interface DiagnosisHeaderProps {
  diagnosis: ErrorDiagnosis;
  onAskTutor?: () => void;
}

export const DiagnosisHeader: React.FC<DiagnosisHeaderProps> = ({ diagnosis, onAskTutor }) => {

  const formattedTime = new Date(diagnosis.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getSeverityBadge = () => {
    switch (diagnosis.severity) {
      case 'High':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>High Severity</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Medium Severity</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-cyan-400">
            <Info className="w-3.5 h-3.5" />
            <span>Low Severity</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Zero-Pill Clean Metadata Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase font-semibold text-violet-400">
            {diagnosis.language}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-medium text-slate-300">
            {diagnosis.category} Error
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          {getSeverityBadge()}
        </div>

        <div className="flex items-center gap-3">
          {onAskTutor && (
            <button
              type="button"
              onClick={onAskTutor}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-violet-300 bg-violet-950/60 hover:bg-violet-900/60 border border-violet-700/60 rounded-lg transition-colors shadow-xs"
              title="Discuss this error with Whiz in Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span>Ask Whiz in Chat</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] tabular-nums">
            <Clock className="w-3 h-3" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
        {diagnosis.title}
      </h1>

      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
        <strong className="text-slate-300">Severity Context: </strong>
        {diagnosis.severityReason}
      </p>
    </div>
  );
};
