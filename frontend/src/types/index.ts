// ============================================================
// Shared types for the AI Video Summarizer frontend
// ============================================================

export type OutputType = 'summary' | 'flashcards' | 'keyPoints' | 'highlights';

export const ALL_OUTPUT_TYPES: OutputType[] = [
  'summary',
  'flashcards',
  'keyPoints',
  'highlights',
];

export const OUTPUT_LABELS: Record<OutputType, string> = {
  summary: 'Text Summary',
  flashcards: 'Flashcards',
  keyPoints: 'Key Points',
  highlights: 'Highlights',
};

export const OUTPUT_DESCRIPTIONS: Record<OutputType, string> = {
  summary: 'Executive summary, detailed breakdown & conclusion',
  flashcards: 'Q&A study cards covering key concepts',
  keyPoints: 'Concise bullet points of the essentials',
  highlights: 'Standout moments, takeaways & insights',
};

export type JobStage =
  | 'queued'
  | 'uploading'
  | 'extracting'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'failed';

export interface SectionBreakdownItem {
  title: string;
  content: string;
}

export interface SummaryResult {
  executiveSummary: string;
  detailedSummary: string;
  sectionBreakdown: SectionBreakdownItem[];
  conclusion: string;
}

export interface FlashcardItem {
  question: string;
  answer: string;
}

export type HighlightType = 'moment' | 'takeaway' | 'statement' | 'insight';

export interface HighlightItem {
  type: HighlightType;
  title: string;
  description: string;
  timestamp?: string;
}

export interface VideoAnalysisResult {
  videoTitle?: string;
  summary?: SummaryResult;
  flashcards?: FlashcardItem[];
  keyPoints?: string[];
  highlights?: HighlightItem[];
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStage;
  progress: number;
  message: string;
  result?: VideoAnalysisResult;
  error?: string;
  fromCache?: boolean;
  chatAvailable?: boolean;
}

export type ChatRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** True while waiting on the API response for this turn */
  pending?: boolean;
  /** True if this turn failed and can be retried */
  failed?: boolean;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

/** Stored in localStorage for "Recent summary history" */
export interface HistoryEntry {
  id: string;
  title: string;
  source: 'file' | 'url';
  sourceLabel: string;
  outputs: OutputType[];
  result: VideoAnalysisResult;
  createdAt: number;
}
