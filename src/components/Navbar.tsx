import { Terminal, BookOpen, History, Sparkles, LogIn, LogOut, Cloud, HardDrive, MessageSquare, Bot } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isAuthLoading: boolean;
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onLoadRandomSample: () => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignIn,
  onSignOut,
  isAuthLoading,
  onOpenGuide,
  onOpenHistory,
  historyCount,
  onLoadRandomSample,
  onOpenChat,
}) => {

  return (
    <header className="border-b border-slate-800/80 bg-[#0c101c]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white font-mono whitespace-nowrap">
              Error<span className="text-violet-400">Whisper</span>
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline whitespace-nowrap">
              Understand the error · Learn the fix
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links & Cloud sync state */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <a
            href="#workspace"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Workspace
          </a>
          <button
            type="button"
            onClick={onLoadRandomSample}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Sample Errors
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="hover:text-violet-300 text-violet-300 transition-colors whitespace-nowrap shrink-0 text-left flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-950/50 border border-violet-700/60"
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-medium">Whiz Chat</span>
          </button>
          <button
            type="button"
            onClick={onOpenGuide}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Guide & Privacy</span>
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 text-left flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent ({historyCount})</span>
            {user ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 ml-1" title="Synced to Firestore">
                <Cloud className="w-3 h-3" />
                <span>Cloud</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5 ml-1" title="Stored locally in browser">
                <HardDrive className="w-3 h-3" />
                <span>Local</span>
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions & Google Sign-In */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenChat}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 border border-violet-500/50 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
            title="Open Whiz AI Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-200" />
            <span className="hidden sm:inline">Ask Whiz</span>
            <span className="sm:hidden">Whiz</span>
          </button>

          <button
            type="button"
            onClick={onLoadRandomSample}
            className="hidden sm:flex px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors whitespace-nowrap items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Try Sample</span>
          </button>

          {isAuthLoading ? (
            <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 p-1 pl-2 bg-slate-900 border border-slate-800 rounded-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-violet-600 text-[10px] flex items-center justify-center font-bold text-white">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:inline">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                  title="Sign out of Firebase"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenHistory}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 border border-slate-700"
            title="History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
