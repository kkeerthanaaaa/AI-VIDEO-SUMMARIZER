import { useState } from 'react';
import { Check, Copy, FileDown, FileText, Loader2 } from 'lucide-react';
import { OutputType, VideoAnalysisResult } from '../../types';
import { buildPlainTextReport, copyToClipboard, downloadPdf, downloadTextFile, slugifyFilename } from '../../utils/export';

interface ResultActionsProps {
  result: VideoAnalysisResult;
  outputs: OutputType[];
  /** Short label shown next to the icon-only buttons on larger screens */
  label?: string;
  size?: 'sm' | 'md';
}

export function ResultActions({ result, outputs, label, size = 'sm' }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const baseName = slugifyFilename(result.videoTitle || 'video-summary');

  const handleCopy = async () => {
    const text = buildPlainTextReport(result, outputs);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadTxt = () => {
    const text = buildPlainTextReport(result, outputs);
    downloadTextFile(`${baseName}.txt`, text);
  };

  const handleDownloadPdf = async () => {
    setIsPdfGenerating(true);
    try {
      await downloadPdf(`${baseName}.pdf`, result, outputs);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const btnClass =
    size === 'sm'
      ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400'
      : 'inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-400 sm:inline">
          {label}
        </span>
      )}
      <button type="button" onClick={handleCopy} className={btnClass} title="Copy to clipboard">
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button type="button" onClick={handleDownloadTxt} className={btnClass} title="Download as TXT">
        <FileText size={14} />
        TXT
      </button>
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isPdfGenerating}
        className={btnClass}
        title="Download as PDF"
      >
        {isPdfGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
        PDF
      </button>
    </div>
  );
}
