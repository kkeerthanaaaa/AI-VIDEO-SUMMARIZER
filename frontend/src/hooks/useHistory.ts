import { useCallback } from 'react';
import { HistoryEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

const HISTORY_KEY = 'ai-video-summarizer:history';
const MAX_HISTORY_ITEMS = 12;

/**
 * Manages "Recent summary history" persisted to localStorage. Each entry
 * stores the full generated result so previous summaries can be revisited
 * instantly without re-calling the API.
 */
export function useHistory() {
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>(HISTORY_KEY, []);

  const addEntry = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
      return newEntry;
    },
    [setHistory]
  );

  const removeEntry = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  return { history, addEntry, removeEntry, clearHistory };
}
