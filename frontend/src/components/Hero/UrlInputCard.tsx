import { useMemo } from 'react';
import { Link2, Youtube } from 'lucide-react';

interface UrlInputCardProps {
  url: string;
  onUrlChange: (url: string) => void;
  disabled?: boolean;
}

const YOUTUBE_PATTERN = /(youtube\.com|youtu\.be)/i;

function isLikelyValidUrl(value: string): boolean {
  if (!value.trim()) return true; // empty is "neutral", not invalid
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function UrlInputCard({ url, onUrlChange, disabled }: UrlInputCardProps) {
  const isYouTube = useMemo(() => YOUTUBE_PATTERN.test(url), [url]);
  const isValid = useMemo(() => isLikelyValidUrl(url), [url]);

  return (
    <div className="flex min-h-[180px] flex-col justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 px-6 py-10">
      <label htmlFor="video-url" className="text-sm font-medium text-slate-700 dark:text-slate-200">
        Paste a YouTube link or a direct video URL
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white dark:bg-surface-dark-card px-3 py-2.5 shadow-soft transition-colors ${
          !isValid
            ? 'border-red-300 dark:border-red-800'
            : 'border-slate-200 dark:border-slate-700 focus-within:border-brand-400'
        }`}
      >
        {isYouTube ? (
          <Youtube size={18} className="flex-shrink-0 text-red-500" />
        ) : (
          <Link2 size={18} className="flex-shrink-0 text-slate-400" />
        )}
        <input
          id="video-url"
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          disabled={disabled}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />
      </div>
      {!isValid && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          Please enter a valid http(s) URL.
        </p>
      )}
      <p className="text-xs text-slate-400">
        Works with public YouTube videos and direct links to MP4/MOV/WEBM files.
      </p>
    </div>
  );
}
