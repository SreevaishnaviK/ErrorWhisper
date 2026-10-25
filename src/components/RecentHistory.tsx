import React from 'react';
import { ErrorDiagnosis } from '../types';
import { History, Trash2, ArrowRight, X, Cloud, HardDrive } from 'lucide-react';

interface RecentHistoryProps {
  history: ErrorDiagnosis[];
  onSelect: (item: ErrorDiagnosis) => void;
  onClear: () => void;
  onDeleteItem?: (id: string) => void;
  onClose?: () => void;
  activeId?: string;
  isDrawer?: boolean;
  isCloudSynced?: boolean;
}

export const RecentHistory: React.FC<RecentHistoryProps> = ({
  history,
  onSelect,
  onClear,
  onDeleteItem,
  onClose,
  activeId,
  isDrawer = false,
  isCloudSynced = false,
}) => {
  return (
    <div
      className={`bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-3 ${
        isDrawer ? 'h-full' : ''
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Recent Analyses ({history.length})</span>
            {isCloudSynced ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-normal">
                <Cloud className="w-3 h-3" />
                <span>Firestore Synced</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-normal">
                <HardDrive className="w-3 h-3" />
                <span>Local Browser</span>
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-rose-950/30"
              title={isCloudSynced ? 'Clear all analyses from your cloud account' : 'Clear all local browser analyses'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          <p>No recent analyses found.</p>
          <p className="text-[11px] text-slate-600 mt-1">
            {isCloudSynced
              ? 'Your diagnoses will automatically sync to your Firebase Firestore database.'
              : 'Sign in with Google to sync your debugging history across devices.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
          {history.map((item) => {
            const isActive = item.id === activeId;
            return (
              <div
                key={item.id}
                className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-start justify-between gap-2 group ${
                  isActive
                    ? 'bg-violet-950/40 border-violet-600 text-white shadow-sm'
                    : 'bg-[#0c101c] border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-grow text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2 text-[11px] mb-1 text-slate-400">
                    <span className="font-mono uppercase font-semibold text-violet-400">
                      {item.language}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="truncate">{item.category}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-slate-500 text-[10px]">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-medium truncate text-slate-200">
                    {item.title}
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  {onDeleteItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="p-1 text-slate-500 hover:text-white"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
        {isCloudSynced ? (
          <>
            <Cloud className="w-3 h-3 text-emerald-400" />
            <span>Persisted in Google Cloud Firestore</span>
          </>
        ) : (
          <>
            <HardDrive className="w-3 h-3 text-slate-500" />
            <span>Local session storage · Sign in to save to cloud</span>
          </>
        )}
      </div>
    </div>
  );
};
