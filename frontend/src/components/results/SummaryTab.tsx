import { SummaryResult, VideoAnalysisResult } from '../../types';
import { ResultActions } from './ResultActions';

interface SummaryTabProps {
  result: VideoAnalysisResult;
  summary: SummaryResult;
}

export function SummaryTab({ result, summary }: SummaryTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-end">
        <ResultActions result={result} outputs={['summary']} />
      </div>

      <section>
        <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
          Executive Summary
        </h3>
        <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
          {summary.executiveSummary}
        </p>
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
          Detailed Summary
        </h3>
        <div className="mt-2 space-y-3 leading-relaxed text-slate-600 dark:text-slate-300">
          {summary.detailedSummary
            .split(/\n+/)
            .filter(Boolean)
            .map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
        </div>
      </section>

      {summary.sectionBreakdown?.length > 0 && (
        <section>
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
            Section-wise Breakdown
          </h3>
          <div className="mt-3 space-y-3">
            {summary.sectionBreakdown.map((section, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/50 text-xs font-bold text-brand-700 dark:text-brand-300">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      {section.title}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
          Conclusion
        </h3>
        <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
          {summary.conclusion}
        </p>
      </section>
    </div>
  );
}
