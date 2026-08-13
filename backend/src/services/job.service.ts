import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { Job, JobStage, VideoAnalysisResult, VideoReference } from '../types';
import { logger } from '../utils/logger';

/**
 * Simple in-memory job store.
 *
 * Each video processing request is tracked as a "job" with a stage,
 * progress percentage, and (eventually) a result or error. The frontend
 * polls GET /api/video/status/:id to render the "Uploading... / Extracting
 * video... / Analyzing content... / Generating output..." progress UI.
 *
 * NOTE: This works well for a single backend instance (e.g. one Render or
 * Railway service). For horizontally-scaled deployments, replace this with
 * a shared store (Redis, a database, etc).
 */

const jobs = new Map<string, Job>();

const STAGE_MESSAGES: Record<JobStage, string> = {
  queued: 'Queued...',
  uploading: 'Uploading video...',
  extracting: 'Extracting video...',
  analyzing: 'Analyzing content...',
  generating: 'Generating output...',
  completed: 'Done!',
  failed: 'Something went wrong.',
};

const STAGE_PROGRESS: Record<JobStage, number> = {
  queued: 5,
  uploading: 20,
  extracting: 45,
  analyzing: 70,
  generating: 90,
  completed: 100,
  failed: 100,
};

export function createJob(): Job {
  const id = uuidv4();
  const now = Date.now();
  const job: Job = {
    id,
    status: 'queued',
    progress: STAGE_PROGRESS.queued,
    message: STAGE_MESSAGES.queued,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function setJobStage(id: string, stage: JobStage, customMessage?: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = stage;
  job.progress = STAGE_PROGRESS[stage];
  job.message = customMessage ?? STAGE_MESSAGES[stage];
  job.updatedAt = Date.now();
}

export function completeJob(
  id: string,
  result: VideoAnalysisResult,
  fromCache = false,
  videoRef?: VideoReference
): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = 'completed';
  job.progress = 100;
  job.message = STAGE_MESSAGES.completed;
  job.result = result;
  job.fromCache = fromCache;
  job.updatedAt = Date.now();
  if (videoRef) job.videoRef = videoRef;
}

/** Stores the Gemini video reference on a job so chat follow-ups can reuse it. */
export function setJobVideoRef(id: string, videoRef: VideoReference): void {
  const job = jobs.get(id);
  if (!job) return;
  job.videoRef = videoRef;
}

export function failJob(id: string, error: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.status = 'failed';
  job.progress = 100;
  job.message = STAGE_MESSAGES.failed;
  job.error = error;
  job.updatedAt = Date.now();
}

/**
 * Periodically removes old jobs to avoid unbounded memory growth, deleting
 * any associated Gemini-hosted file so it doesn't linger in the Files API.
 */
export function startJobCleanup(onExpire?: (videoRef: VideoReference) => void): void {
  const intervalMs = Math.max(60_000, env.jobTtlSeconds * 1000);
  setInterval(() => {
    const cutoff = Date.now() - env.jobTtlSeconds * 1000;
    let removed = 0;
    for (const [id, job] of jobs.entries()) {
      if (job.updatedAt < cutoff && (job.status === 'completed' || job.status === 'failed')) {
        if (job.videoRef?.geminiFileName) {
          onExpire?.(job.videoRef);
        }
        jobs.delete(id);
        removed += 1;
      }
    }
    if (removed > 0) {
      logger.debug(`Job cleanup: removed ${removed} stale job(s)`);
    }
  }, intervalMs).unref?.();
}
