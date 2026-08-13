import { Clock, FileVideo, Link2, Trash2, X } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelect,
  onRemove,
  onClearAll,
}: HistoryDrawerProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark-card shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Recent summary history"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h3 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
            Recent Summaries
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {history.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <Clock size={32} className="mb-3 opacity-50" />
              <p className="text-sm">No summaries yet.</p>
              <p className="text-xs">Generated summaries will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {history.map((entry) => (
                <li key={entry.id}>
                  <div className="group flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 transition-colors hover:border-brand-300 dark:hover:border-brand-700">
                    <button
                      type="button"
                      onClick={() => onSelect(entry)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                        {entry.source === 'file' ? <FileVideo size={15} /> : <Link2 size={15} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {entry.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {formatRelativeTime(entry.createdAt)} &middot; {entry.outputs.length}{' '}
                          format{entry.outputs.length !== 1 ? 's' : ''}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(entry.id)}
                      aria-label="Remove from history"
                      className="flex-shrink-0 rounded-full p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {history.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3">
            <button
              type="button"
              onClick={onClearAll}
              className="w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
