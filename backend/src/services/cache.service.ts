import crypto from 'crypto';
import fs from 'fs';
import NodeCache from 'node-cache';
import { env } from '../config/env';
import { OutputType, VideoAnalysisResult } from '../types';

/**
 * In-memory cache of generated results, keyed by a hash of the input
 * (file contents or URL) plus the selected output types.
 *
 * For multi-instance / serverless deployments, swap this out for a
 * shared store such as Redis - the interface below is intentionally
 * small so that's a drop-in change.
 */
const cache = new NodeCache({
  stdTTL: env.cacheTtlSeconds,
  checkperiod: Math.max(60, Math.floor(env.cacheTtlSeconds / 10)),
  useClones: true,
});

export function buildCacheKeyFromHash(hash: string, outputs: OutputType[]): string {
  return `file:${hash}:${[...outputs].sort().join(',')}`;
}

/** Computes a sha256 hash of a file on disk without loading it fully into memory. */
export function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export function buildCacheKeyFromUrl(url: string, outputs: OutputType[]): string {
  const hash = crypto.createHash('sha256').update(url).digest('hex');
  return `url:${hash}:${[...outputs].sort().join(',')}`;
}

export function getCachedResult(key: string): VideoAnalysisResult | undefined {
  return cache.get<VideoAnalysisResult>(key);
}

export function setCachedResult(key: string, result: VideoAnalysisResult): void {
  cache.set(key, result);
}

export function getCacheStats() {
  return cache.getStats();
}
