import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { SupportedLanguage, ErrorDiagnosis, SampleError } from './types';
import { SAMPLE_ERRORS } from './data/samples';
import { ApiService } from './services/api';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveAnalysisToFirestore,
  deleteAnalysisFromFirestore,
  subscribeToUserAnalyses,
  activeFirebaseConfig,
} from './firebase';
import { Navbar } from './components/Navbar';
import { InputWorkspace } from './components/InputWorkspace';
import { DiagnosisHeader } from './components/DiagnosisHeader';
import { BeginnerCard } from './components/BeginnerCard';
import { FixMyCodePanel } from './components/FixMyCodePanel';
import { EvidenceStepsPanel } from './components/EvidenceStepsPanel';
import { PracticeQuizCard } from './components/PracticeQuizCard';
import { RecentHistory } from './components/RecentHistory';
import { EmptyOrLoadingState } from './components/EmptyOrLoadingState';
import { GuideModal } from './components/GuideModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import { AlertCircle, RotateCcw, Cloud, CheckCircle2, MessageSquare } from 'lucide-react';

const STORAGE_HISTORY_KEY = 'errorwhisper_recent_analyses_v1';

export default function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Input form state
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [context, setContext] = useState<string>('');

  // UI status states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Analysis results and history
  const [currentDiagnosis, setCurrentDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [history, setHistory] = useState<ErrorDiagnosis[]>([]);

  // Modals & Panels
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);


  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // When user is signed in, subscribe to their Firestore analyses; otherwise use localStorage
  useEffect(() => {
    if (user) {
      const unsubscribeFirestore = subscribeToUserAnalyses(
        user.uid,
        (cloudAnalyses) => {
          setHistory(cloudAnalyses);
        },
        (err) => {
          // Graceful Firestore listener notification
          setAuthError('Realtime sync is momentarily offline.');
        }
      );
      return () => unsubscribeFirestore();
    } else {
      // Load from local storage for guest
      try {
        const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch (_) {}
    }
  }, [user]);

  const saveToHistory = async (item: ErrorDiagnosis) => {
    // If authenticated, persist to Firestore
    if (user) {
      try {
        await saveAnalysisToFirestore(user.uid, item);
      } catch (e: any) {
        setAuthError('Could not sync analysis to cloud. Stored locally.');
      }
    } else {
      // Persist to localStorage
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.id !== item.id);
        const updated = [item, ...filtered].slice(0, 15);
        try {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    }
  };

  const handleClearHistory = async () => {
    if (user) {
      // Delete each analysis from Firestore
      for (const item of history) {
        try {
          await deleteAnalysisFromFirestore(user.uid, item.id);
        } catch (e) {
          // Ignore transient delete issues
        }
      }
      setHistory([]);
    } else {
      localStorage.removeItem(STORAGE_HISTORY_KEY);
      setHistory([]);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    if (user) {
      try {
        await deleteAnalysisFromFirestore(user.uid, id);
      } catch (e) {
        // Handled silently
      }
    } else {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const signedInUser = await signInWithGoogle();
      setAuthSuccessMsg(`Welcome, ${signedInUser.displayName || 'Student'}! Your history is now synced with Firestore.`);
      setTimeout(() => setAuthSuccessMsg(null), 4000);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        const targetProject = activeFirebaseConfig.projectId;
        setAuthError(
          `Unauthorized Domain: "${currentDomain}" is not in the Authorized Domains list for Firebase project "${targetProject}". Please add "${currentDomain}" to Firebase Console -> Authentication -> Settings -> Authorized Domains for project "${targetProject}".`
        );
        return;
      }
      setAuthError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setAuthSuccessMsg('Signed out successfully.');
      setTimeout(() => setAuthSuccessMsg(null), 3000);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign out');
    }
  };

  const handleSelectSample = (sample: SampleError) => {
    setLanguage(sample.language);
    setCode(sample.code);
    setErrorText(sample.error);
    setContext(sample.context || '');
    setValidationError(null);
    setApiError(null);
  };

  const handleLoadRandomSample = () => {
    const randomIdx = Math.floor(Math.random() * SAMPLE_ERRORS.length);
    handleSelectSample(SAMPLE_ERRORS[randomIdx]);
  };

  const handleClearForm = () => {
    setCode('');
    setErrorText('');
    setContext('');
    setValidationError(null);
    setApiError(null);
  };

  const handleAnalyze = async () => {
    setValidationError(null);
    setApiError(null);

    if (!code.trim() && !errorText.trim()) {
      setValidationError('Please supply either your code, the error message, or both to begin analysis.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ApiService.analyzeError(language, code, errorText, context);
      setCurrentDiagnosis(result);
      await saveToHistory(result);
    } catch (err: any) {
      setApiError(err.message || 'An unexpected error occurred while communicating with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromHistory = (item: ErrorDiagnosis) => {
    setCurrentDiagnosis(item);
    setLanguage(item.language);
    setCode(item.inputCode);
    setErrorText(item.inputError);
    setContext(item.inputContext || '');
    setValidationError(null);
    setApiError(null);
    setIsHistoryDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-violet-600/30 selection:text-violet-200">
      {/* Top Bar with Firebase Auth */}
      <Navbar
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isAuthLoading={isAuthLoading}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={history.length}
        onLoadRandomSample={handleLoadRandomSample}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="workspace">
        
        {/* Auth success / notification banner */}
        {authSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{authSuccessMsg}</span>
          </div>
        )}

        {authError && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Header with Cloud Sync Banner */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Your error is trying to tell you something.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Paste your code and error message, or dictate using voice transcription. Understand what went wrong, fix it, and learn why.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {user && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Sync Active</span>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Code & Error Input Workspace */}
          <div className="lg:col-span-5 space-y-6">
            <InputWorkspace
              language={language}
              setLanguage={setLanguage}
              code={code}
              setCode={setCode}
              errorText={errorText}
              setErrorText={setErrorText}
              context={context}
              setContext={setContext}
              onAnalyze={handleAnalyze}
              onClear={handleClearForm}
              onSelectSample={handleSelectSample}
              isLoading={isLoading}
              validationError={validationError}
            />

            {/* Embedded Desktop Recent Analyses */}
            <div className="hidden lg:block">
              <RecentHistory
                history={history}
                onSelect={handleSelectFromHistory}
                onClear={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
                activeId={currentDiagnosis?.id}
                isCloudSynced={Boolean(user)}
              />
            </div>
          </div>

          {/* Right Column: Diagnosis & Fix & Learning */}
          <div className="lg:col-span-7 space-y-5">
            {apiError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Analysis Request Failed</span>
                </div>
                <p className="leading-relaxed">{apiError}</p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/80 text-white font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Request</span>
                  </button>
                  <span className="text-[11px] text-slate-400">Your inputs were preserved.</span>
                </div>
              </div>
            )}

            {/* If analyzing or no diagnosis yet */}
            {isLoading || !currentDiagnosis ? (
              <EmptyOrLoadingState
                isLoading={isLoading}
                onSelectSample={handleSelectSample}
              />
            ) : (
              /* Populated Results View */
              <div className="space-y-5">
                <DiagnosisHeader
                  diagnosis={currentDiagnosis}
                  onAskTutor={() => {
                    setChatInitialPrompt(
                      `I'm trying to understand this ${currentDiagnosis.language} error: "${currentDiagnosis.title}". The diagnosed cause is: "${currentDiagnosis.likelyCause}". Could you explain what this means in simple terms and guide me on how to avoid it?`
                    );
                    setIsChatOpen(true);
                  }}
                />
                <BeginnerCard diagnosis={currentDiagnosis} />
                <FixMyCodePanel diagnosis={currentDiagnosis} />
                <EvidenceStepsPanel diagnosis={currentDiagnosis} />
                <PracticeQuizCard
                  practice={currentDiagnosis.practice}
                  language={currentDiagnosis.language}
                  category={currentDiagnosis.category}
                />
              </div>
            )}

            {/* Mobile Recent History */}
            <div className="lg:hidden">
              <RecentHistory
                history={history}
                onSelect={handleSelectFromHistory}
                onClear={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
                activeId={currentDiagnosis?.id}
                isCloudSynced={Boolean(user)}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Guide & Privacy Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Slide-out Drawer for History on Mobile */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm h-full bg-[#121826] p-4 shadow-2xl">
            <RecentHistory
              history={history}
              onSelect={handleSelectFromHistory}
              onClear={handleClearHistory}
              onDeleteItem={handleDeleteHistoryItem}
              onClose={() => setIsHistoryDrawerOpen(false)}
              activeId={currentDiagnosis?.id}
              isDrawer={true}
              isCloudSynced={Boolean(user)}
            />
          </div>
        </div>
      )}

      {/* Floating Gemini Chatbot Quick Launch Button */}
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs sm:text-sm shadow-xl shadow-violet-950/60 border border-violet-400/40 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
        title="Open Whiz - AI Tutor & Debugging Chat"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
        </span>
        <MessageSquare className="w-4 h-4 text-violet-200 group-hover:rotate-6 transition-transform" />
        <span>Ask Whiz</span>
      </button>

      {/* Gemini Chatbot Modal */}
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialPrompt(undefined);
        }}
        currentLanguage={language}
        currentCode={code}
        currentError={errorText}
        initialPrompt={chatInitialPrompt}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c101c] py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-mono text-slate-400">
            ErrorWhisper · Understand the error. Learn the fix.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Powered by Gemini & Firebase</span>
            <span aria-hidden="true">·</span>
            <span>{user ? 'Cloud sync connected' : 'Guest mode available'}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Guide & Safety
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
