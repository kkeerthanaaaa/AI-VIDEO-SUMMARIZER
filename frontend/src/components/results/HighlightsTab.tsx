import { Clock, Lightbulb, MessageSquareQuote, Sparkles, Star } from 'lucide-react';
import { HighlightItem, HighlightType, VideoAnalysisResult } from '../../types';
import { ResultActions } from './ResultActions';

interface HighlightsTabProps {
  result: VideoAnalysisResult;
  highlights: HighlightItem[];
}

const TYPE_CONFIG: Record<
  HighlightType,
  { label: string; icon: JSX.Element; classes: string }
> = {
  moment: {
    label: 'Key Moment',
    icon: <Star size={16} />,
    classes:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
  },
  takeaway: {
    label: 'Major Takeaway',
    icon: <Sparkles size={16} />,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  statement: {
    label: 'Noteworthy Statement',
    icon: <MessageSquareQuote size={16} />,
    classes:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300',
  },
  insight: {
    label: 'Critical Insight',
    icon: <Lightbulb size={16} />,
    classes:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300',
  },
};

export function HighlightsTab({ result, highlights }: HighlightsTabProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {highlights.length} highlights
        </p>
        <ResultActions result={result} outputs={['highlights']} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {highlights.map((highlight, idx) => {
          const config = TYPE_CONFIG[highlight.type] ?? TYPE_CONFIG.insight;
          return (
            <div
              key={idx}
              className={`rounded-2xl border-l-4 p-4 shadow-soft ${config.classes}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                  {config.icon}
                  {config.label}
                </span>
                {highlight.timestamp && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-black/20 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <Clock size={11} />
                    {highlight.timestamp}
                  </span>
                )}
              </div>
              <h4 className="mt-2 font-display text-base font-semibold text-slate-800 dark:text-slate-100">
                {highlight.title}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {highlight.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
