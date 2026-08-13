import { History, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onToggleHistory: () => void;
  historyCount: number;
}

export function Header({ onToggleHistory, historyCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-card">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            AI Video Summarizer
          </span>
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleHistory}
            className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card px-3 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
          >
            <History size={16} />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {historyCount}
              </span>
            )}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
