export type SupportedLanguage = 'python' | 'java' | 'c' | 'cpp' | 'javascript';

export type ErrorCategory =
  | 'Syntax'
  | 'Type'
  | 'Runtime'
  | 'Logic'
  | 'Dependency'
  | 'Configuration'
  | 'Unknown';

export type ErrorSeverity = 'Low' | 'Medium' | 'High';

export interface EvidenceItem {
  text: string;
  explanation: string;
}

export interface CodeLocation {
  line: number | null;
  column: number | null;
  note: string;
}

export interface ChangeItem {
  change: string;
  reason: string;
}

export interface PracticeQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface ErrorDiagnosis {
  id: string;
  timestamp: number;
  language: SupportedLanguage;
  inputCode: string;
  inputError: string;
  inputContext?: string;
  title: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  severityReason: string;
  explanation: string;
  technicalDetail: string;
  likelyCause: string;
  evidence: EvidenceItem[];
  location: CodeLocation;
  steps: string[];
  correctedCode: string | null;
  changes: ChangeItem[];
  confidenceNote: string;
  preventionTip: string;
  practice: PracticeQuestion;
}

export interface SampleError {
  id: string;
  label: string;
  language: SupportedLanguage;
  code: string;
  error: string;
  context?: string;
  expectedCategory: string;
  description: string;
}

export type ChatRole = 'user' | 'model';

export type TutorPersona = 'tutor' | 'architect' | 'speed' | 'socratic';

export type ComplexityLevel = 'fast' | 'general' | 'complex';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  modelUsed?: string;
}

