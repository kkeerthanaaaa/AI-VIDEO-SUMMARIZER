import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  FileText,
  Layers,
  ListChecks,
  MessageCircle,
  Sparkles,
  Type,
} from 'lucide-react';
import { OutputType, VideoAnalysisResult } from '../../types';
import { getResultStats } from '../../utils/textStats';
import { ResultActions } from './ResultActions';
import { SummaryTab } from './SummaryTab';
import { FlashcardsTab } from './FlashcardsTab';
import { KeyPointsTab } from './KeyPointsTab';
import { HighlightsTab } from './HighlightsTab';
import { ChatTab } from './ChatTab';

interface ResultsPageProps {
  result: VideoAnalysisResult;
  outputs: OutputType[];
  onStartNew: () => void;
  fromCache?: boolean;
  /** The processing job this result came from; enables the "Ask" chat tab when present. */
  jobId?: string;
  chatAvailable?: boolean;
}

type TabKey = OutputType | 'chat';

const TAB_CONFIG: { key: OutputType; label: string; icon: JSX.Element }[] = [
  { key: 'summary', label: 'Summary', icon: <FileText size={15} /> },
  { key: 'flashcards', label: 'Flashcards', icon: <Layers size={15} /> },
  { key: 'keyPoints', label: 'Key Points', icon: <ListChecks size={15} /> },
  { key: 'highlights', label: 'Highlights', icon: <Sparkles size={15} /> },
];

export function ResultsPage({
  result,
  outputs,
  onStartNew,
  fromCache,
  jobId,
  chatAvailable,
}: ResultsPageProps) {
  const availableTabs = TAB_CONFIG.filter((tab) => outputs.includes(tab.key));
  const showChatTab = Boolean(jobId && chatAvailable);
  const [activeTab, setActiveTab] = useState<TabKey>(availableTabs[0]?.key ?? 'summary');

  const stats = useMemo(() => getResultStats(result, outputs), [result, outputs]);

  return (
    <div className="animate-slide-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onStartNew}
          className="btn-secondary"
        >
          <ArrowLeft size={16} />
          Summarize another video
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          {fromCache && (
            <span className="chip border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              Served from cache
            </span>
          )}
          <span className="chip">
            <Type size={13} /> {stats.wordCount.toLocaleString()} words
          </span>
          <span className="chip">
            <Clock3 size={13} /> {stats.readingTime}
          </span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate py-4 font-display text-lg font-bold text-slate-900 dark:text-white">
              {result.videoTitle || 'Video Summary'}
            </h2>
          </div>
          <div role="tablist" className="-mb-px flex gap-1 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-button flex items-center gap-1.5 ${
                  activeTab === tab.key ? 'active' : ''
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.key && <span className="tab-indicator" />}
              </button>
            ))}
            {showChatTab && (
              <button
                role="tab"
                aria-selected={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
                className={`tab-button flex items-center gap-1.5 ${
                  activeTab === 'chat' ? 'active' : ''
                }`}
              >
                <MessageCircle size={15} />
                Ask
                {activeTab === 'chat' && <span className="tab-indicator" />}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'summary' && result.summary && (
            <SummaryTab result={result} summary={result.summary} />
          )}
          {activeTab === 'flashcards' && result.flashcards && (
            <FlashcardsTab result={result} flashcards={result.flashcards} />
          )}
          {activeTab === 'keyPoints' && result.keyPoints && (
            <KeyPointsTab result={result} keyPoints={result.keyPoints} />
          )}
          {activeTab === 'highlights' && result.highlights && (
            <HighlightsTab result={result} highlights={result.highlights} />
          )}
          {activeTab === 'chat' && jobId && (
            <ChatTab jobId={jobId} videoTitle={result.videoTitle} />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card px-4 py-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Export everything at once
        </span>
        <ResultActions result={result} outputs={outputs} size="md" />
      </div>
    </div>
  );
}
