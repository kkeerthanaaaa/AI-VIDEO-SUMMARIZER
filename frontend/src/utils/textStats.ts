import { OutputType, VideoAnalysisResult } from '../types';
import { buildPlainTextReport } from './export';

const WORDS_PER_MINUTE = 200;

/** Counts words in a string (whitespace-delimited). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Returns "X min read" given a word count. */
export function estimateReadingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/**
 * Computes word count + reading time across all selected output sections
 * of a result (used for the "Word count" / "Estimated reading time" stats
 * shown on the results page).
 */
export function getResultStats(
  result: VideoAnalysisResult,
  outputs: OutputType[]
): { wordCount: number; readingTime: string } {
  const text = buildPlainTextReport(result, outputs, { includeTitle: false });
  const wordCount = countWords(text);
  return { wordCount, readingTime: estimateReadingTime(wordCount) };
}
