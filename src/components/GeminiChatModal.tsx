import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Trash2,
  Cpu,
  GraduationCap,
  Zap,
  HelpCircle,
  Code2,
  RefreshCw,
  Terminal,
  Maximize2,
  Minimize2,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { TutorPersona, ComplexityLevel, ChatMessage, SupportedLanguage } from '../types';
import { ApiService } from '../services/api';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: SupportedLanguage;
  currentCode?: string;
  currentError?: string;
  initialPrompt?: string;
}

const STORAGE_CHAT_KEY = 'errorwhisper_gemini_chat_history_v1';
const STORAGE_PERSONA_KEY = 'errorwhisper_tutor_persona_v1';
const STORAGE_COMPLEXITY_KEY = 'errorwhisper_model_complexity_v1';

const PERSONAS: { id: TutorPersona; name: string; icon: React.ElementType; description: string; badge: string }[] = [
  {
    id: 'tutor',
    name: 'Whiz (Empathetic)',
    icon: GraduationCap,
    description: 'Patient, beginner-friendly analogies and step-by-step guidance',
    badge: 'Beginner Friendly',
  },
  {
    id: 'socratic',
    name: 'Socratic Coach',
    icon: HelpCircle,
    description: 'Guides with targeted questions & hints without spoiling the answer',
    badge: 'Active Learning',
  },
  {
    id: 'speed',
    name: 'Speed Spotter',
    icon: Zap,
    description: 'Direct, rapid root cause identification and immediate minimal fix',
    badge: 'Fast & Punchy',
  },
  {
    id: 'architect',
    name: 'Senior Architect',
    icon: Cpu,
    description: 'Deep systems mechanics, memory layouts, compiler internals & Big-O',
    badge: 'Deep Reasoning',
  },
];

const COMPLEXITY_LEVELS: { id: ComplexityLevel; label: string; modelTarget: string; desc: string }[] = [
  {
    id: 'fast',
    label: 'Fast',
    modelTarget: 'gemini-3.1-flash-lite',
    desc: 'Instant replies for syntax checks & quick answers',
  },
  {
    id: 'general',
    label: 'General',
    modelTarget: 'gemini-3.8-flash',
    desc: 'Rich reasoning & balanced conceptual depth',
  },
  {
    id: 'complex',
    label: 'Complex',
    modelTarget: 'gemini-4-argon',
    desc: 'Deep multi-step algorithmic analysis & internals',
  },
];

// Helper to render formatted markdown with custom code blocks and copy buttons
const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code blocks ```...```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          let lang = 'code';
          let codeBody = lines.join('\n');

          // If first line is a language tag (e.g. python, java, c, cpp, js, json)
          if (/^[a-zA-Z0-9_-]+$/.test(firstLine)) {
            lang = firstLine;
            codeBody = lines.slice(1).join('\n');
          }

          return (
            <div key={index} className="rounded-lg border border-slate-700/80 bg-slate-950 overflow-hidden my-3">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 uppercase font-semibold text-cyan-400">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  {lang}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeBody, index)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-xs font-mono text-emerald-300/90 whitespace-pre leading-relaxed">
                {codeBody}
              </pre>
            </div>
          );
        }

        // Normal text block: render paragraphs, inline code, bold, bullets
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              // Header
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-sm font-bold text-violet-300 mt-2">
                    {trimmed.slice(4)}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-base font-bold text-white mt-3">
                    {trimmed.slice(3)}
                  </h3>
                );
              }

              // Bullet list item
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{renderInlineStyles(trimmed.slice(2))}</span>
                  </div>
                );
              }

              // Numbered list item
              if (/^\d+\.\s/.test(trimmed)) {
                const match = trimmed.match(/^(\d+)\.\s(.*)/);
                if (match) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-violet-400 font-mono text-xs mt-0.5">{match[1]}.</span>
                      <span>{renderInlineStyles(match[2])}</span>
                    </div>
                  );
                }
              }

              // Quote block
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={lIdx}
                    className="border-l-2 border-violet-500 pl-3 my-1 italic text-slate-300 bg-slate-900/40 py-1 rounded-r"
                  >
                    {renderInlineStyles(trimmed.slice(2))}
                  </blockquote>
                );
              }

              return <p key={lIdx}>{renderInlineStyles(trimmed)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

// Helper for inline `code` and **bold**
function renderInlineStyles(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((seg, i) => {
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono text-xs border border-slate-800">
          {seg.slice(1, -1)}
        </code>
      );
    }
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    return seg;
  });
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  currentCode,
  currentError,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: 'welcome',
        role: 'model',
        content:
          "👋 Hi there! I'm Whiz, your empathetic programming tutor. Ask me any conceptual question, paste confusing code, or we can step through an error together. How can I help you learn today?",
        timestamp: Date.now(),
        modelUsed: 'gemini-3.1-flash-lite',
      },
    ];
  });

  const [persona, setPersona] = useState<TutorPersona>(() => {
    try {
      return (localStorage.getItem(STORAGE_PERSONA_KEY) as TutorPersona) || 'tutor';
    } catch (_) {
      return 'tutor';
    }
  });

  const [complexity, setComplexity] = useState<ComplexityLevel>(() => {
    try {
      return (localStorage.getItem(STORAGE_COMPLEXITY_KEY) as ComplexityLevel) || 'general';
    } catch (_) {
      return 'general';
    }
  });

  const [includeWorkspaceContext, setIncludeWorkspaceContext] = useState<boolean>(true);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PERSONA_KEY, persona);
    } catch (_) {}
  }, [persona]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COMPLEXITY_KEY, complexity);
    } catch (_) {}
  }, [complexity]);

  // Handle initialPrompt if provided when opening
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setInput(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isOpen, initialPrompt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history to backend proxy
      const historyPayload = updatedMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const contextPayload =
        includeWorkspaceContext && (currentLanguage || currentCode || currentError)
          ? {
              language: currentLanguage,
              currentCode: currentCode || undefined,
              currentError: currentError || undefined,
            }
          : undefined;

      const response = await ApiService.sendChatMessage(
        historyPayload,
        persona,
        complexity,
        contextPayload
      );

      const botMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        role: 'model',
        content: response.content,
        timestamp: Date.now(),
        modelUsed: response.modelUsed,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect to AI tutor. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const defaultWelcome: ChatMessage = {
      id: 'welcome',
      role: 'model',
      content:
        "Conversation reset! I'm ready for your next questions or code debugging session.",
      timestamp: Date.now(),
      modelUsed: 'gemini-3.1-flash-lite',
    };
    setMessages([defaultWelcome]);
    try {
      localStorage.removeItem(STORAGE_CHAT_KEY);
    } catch (_) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterPrompts = [
    ...(currentError
      ? [
          `Can you explain why this error happens in plain English: "${currentError.slice(0, 80)}"?`,
        ]
      : []),
    'Explain how recursion works with a stack trace analogy',
    'Why do off-by-one errors happen in array indexing loops?',
    'What is the difference between shallow copy and deep copy?',
    'Quiz me on Big-O space and time complexity',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`flex flex-col bg-[#0c101c] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isExpanded ? 'w-full h-full max-w-6xl max-h-[96vh]' : 'w-full max-w-3xl h-[85vh] max-h-[750px]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Whiz AI Tutor Chat
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Multi-Turn Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Interactive dialogue, conceptual analogies, and code troubleshooting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand full-screen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona & Complexity Controls Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Persona Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Tutor Mode:</span>
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isActive = persona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-400'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                  title={p.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Model Complexity Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Model:</span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {COMPLEXITY_LEVELS.map((lvl) => {
                const isActive = complexity === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setComplexity(lvl.id)}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${lvl.modelTarget}: ${lvl.desc}`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Workspace Context Indicator (if code or error exists) */}
        {(currentCode || currentError) && (
          <div className="px-4 sm:px-6 py-1.5 bg-cyan-950/20 border-b border-cyan-900/40 flex items-center justify-between text-xs text-cyan-300">
            <div className="flex items-center gap-2 truncate">
              <Code2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">
                Context linked: <span className="font-mono uppercase">{currentLanguage || 'Code'}</span>
                {currentError ? ` · Error: "${currentError.slice(0, 40)}..."` : ' · Active Snippet'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncludeWorkspaceContext(!includeWorkspaceContext)}
              className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors shrink-0 ${
                includeWorkspaceContext
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {includeWorkspaceContext ? 'Linked in Whiz Context' : 'Context Ignored'}
            </button>
          </div>
        )}

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-900 border border-slate-700 text-cyan-400 shadow-sm'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm ${
                    isUser
                      ? 'bg-violet-950/50 border border-violet-800/60 text-slate-100 rounded-tr-xs'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {/* Model header info for tutor responses */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        Whiz
                      </span>
                      {msg.modelUsed && (
                        <span className="font-mono text-[10px] text-cyan-400/90 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-900/50">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message body */}
                  <MarkdownMessage content={msg.content} />

                  <div className="mt-2 text-right">
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-xs bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  Whiz is thinking with {COMPLEXITY_LEVELS.find((c) => c.id === complexity)?.modelTarget}...
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts Carousel (when thread is short) */}
        {messages.length <= 3 && !isLoading && (
          <div className="px-4 sm:px-6 py-2 border-t border-slate-800/60 bg-slate-900/20 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap text-xs">
              <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Suggested:
              </span>
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors text-[11px] truncate max-w-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${PERSONAS.find((p) => p.id === persona)?.name} anything (Enter to send, Shift+Enter for new line)...`}
                rows={2}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none font-sans leading-relaxed disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              title="Send message"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Role: <strong className="text-slate-300">{PERSONAS.find(p => p.id === persona)?.name}</strong></span>
            <span>Target: <strong className="text-slate-300 font-mono">{COMPLEXITY_LEVELS.find(c => c.id === complexity)?.modelTarget}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
