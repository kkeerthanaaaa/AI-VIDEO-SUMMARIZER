import { CircleDot } from 'lucide-react';
import { VideoAnalysisResult } from '../../types';
import { ResultActions } from './ResultActions';

interface KeyPointsTabProps {
  result: VideoAnalysisResult;
  keyPoints: string[];
}

export function KeyPointsTab({ result, keyPoints }: KeyPointsTabProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{keyPoints.length} key points</p>
        <ResultActions result={result} outputs={['keyPoints']} />
      </div>

      <ul className="space-y-2.5">
        {keyPoints.map((point, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card px-4 py-3 shadow-soft"
          >
            <CircleDot size={16} className="mt-0.5 flex-shrink-0 text-brand-500" />
            <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
