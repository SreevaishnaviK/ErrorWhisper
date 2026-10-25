import React from 'react';
import { X, Shield, BookOpen, Terminal, CheckCircle2, Cloud } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121826] border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-800 flex items-center justify-center text-violet-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Student Guide, Cloud Sync & Privacy</h2>
              <p className="text-xs text-slate-400">How ErrorWhisper works and how your data is secured</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-5 overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed">
          {/* Philosophy */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Understand the error. Learn the fix.</span>
            </h3>
            <p className="text-slate-400">
              When compilers output cryptic error messages, it's easy to feel frustrated and copy-paste random solutions. ErrorWhisper translates compiler diagnostics into plain English, isolates what happened, shows you a focused fix, and explains the core computer science concept so you won't get tripped up during lab exams.
            </p>
          </div>

          {/* Smart Error Analyzer & Voice Dictation Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-white text-xs block">Smart Error Analyzer</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Structured root-cause diagnosis, beginner-friendly explanations, step-by-step resolution pathways, and interactive practice questions tailored to your programming language.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-white text-xs block">Voice Dictation (Gemini 3.5 Transcribe)</strong>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dictate stack traces, compiler output, or tricky logic bugs using your microphone or audio files. Audio is accurately transcribed via Google's dedicated <code className="text-cyan-400">gemini-3.5-transcribe</code> model.
              </p>
            </div>
          </div>

          {/* Cloud Sync & Firebase */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Google Sign-In & Firestore Cloud Sync</span>
            </h4>
            <p className="text-slate-300">
              ErrorWhisper connects directly to Google Firebase Authentication and Cloud Firestore:
            </p>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li><strong>Guest Mode:</strong> Diagnoses stay in local browser storage on your current machine.</li>
              <li><strong>Signed-In Mode:</strong> Sign in with Google to automatically persist your debugging sessions and custom practice quizzes to your private Firestore database, accessible across any computer or browser.</li>
              <li><strong>Data Ownership:</strong> You can delete individual items or clear your entire history at any time.</li>
            </ul>
          </div>

          {/* Privacy & Security */}
          <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-900/40 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <span>Security & Firestore Rules</span>
            </h3>
            <ul className="space-y-1 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Role-Based Access Control:</strong> Strict Firestore security rules guarantee that only you can read or write your own saved analyses.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>No Remote Code Execution:</strong> Suggested fixes are static code patches and are never executed on arbitrary servers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Server-Side AI Secrets:</strong> Gemini API calls are made via server-side endpoints, keeping API keys protected.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
