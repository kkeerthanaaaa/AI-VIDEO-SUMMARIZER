import fs from 'fs';
import { NextFunction, Request, Response } from 'express';
import {
  analyzeVideo,
  chatAboutVideo,
  deleteUploadedFile,
  downloadVideoFromUrl,
  uploadAndWaitForActiveFile,
} from '../services/gemini.service';
import {
  buildCacheKeyFromHash,
  buildCacheKeyFromUrl,
  getCachedResult,
  hashFile,
  setCachedResult,
} from '../services/cache.service';
import { createJob, failJob, getJob, setJobStage, completeJob } from '../services/job.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ChatMessage, OutputType, VideoAnalysisResult } from '../types';
import { parseOutputTypes, validateVideoUrl } from '../utils/validators';

/** Removes a local temp file, ignoring errors (e.g. already deleted). */
function safeUnlink(filePath?: string) {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      logger.warn(`Failed to remove temp file ${filePath}`, err);
    }
  });
}

/**
 * POST /api/video/process
 *
 * Accepts EITHER:
 *  - multipart/form-data with a `video` file field, or
 *  - application/json (or form fields) with a `url` field
 * plus an `outputs` field describing which summary formats to generate.
 *
 * Responds immediately with a jobId; the actual Gemini work happens in the
 * background and progress can be polled via GET /api/video/status/:jobId.
 */
export async function processVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const outputs = parseOutputTypes(req.body?.outputs);
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';

    if (!file && !url) {
      throw AppError.badRequest(
        'Please upload a video file or provide a video URL.',
        'NO_INPUT_PROVIDED'
      );
    }

    if (file && url) {
      throw AppError.badRequest(
        'Please provide either a video file or a video URL, not both.',
        'AMBIGUOUS_INPUT'
      );
    }

    // Validate the URL BEFORE responding, so validation errors return a
    // proper 4xx instead of leaving an orphaned "queued" job behind.
    let validatedUrl: { url: string; isYouTube: boolean } | null = null;
    if (!file) {
      validatedUrl = validateVideoUrl(url);
    }

    const job = createJob();
    res.status(202).json({ jobId: job.id });

    if (file) {
      void processUploadedFile(job.id, file, outputs);
    } else if (validatedUrl) {
      void processVideoUrl(job.id, validatedUrl.url, validatedUrl.isYouTube, outputs);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/video/status/:jobId
 */
export function getJobStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const job = getJob(req.params.jobId);
    if (!job) {
      throw AppError.notFound('Job not found. It may have expired.', 'JOB_NOT_FOUND');
    }
    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      result: job.result,
      error: job.error,
      fromCache: job.fromCache ?? false,
      chatAvailable: Boolean(job.videoRef),
    });
  } catch (err) {
    next(err);
  }
}

/** Background processing for an uploaded video file. */
async function processUploadedFile(
  jobId: string,
  file: Express.Multer.File,
  outputs: OutputType[]
) {
  let geminiFileName: string | undefined;
  let succeeded = false;
  try {
    setJobStage(jobId, 'uploading');

    const hash = await hashFile(file.path);
    const cacheKey = buildCacheKeyFromHash(hash, outputs);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      // No fresh Gemini file was uploaded this time (served from cache), so
      // chat follow-ups aren't available without re-uploading the video.
      completeJob(jobId, cached, true);
      succeeded = true;
      return;
    }

    const uploaded = await uploadAndWaitForActiveFile(
      file.path,
      file.mimetype,
      file.originalname,
      (stage) => setJobStage(jobId, stage)
    );
    geminiFileName = uploaded.name;

    const result = await analyzeVideo(
      { fileUri: uploaded.uri, mimeType: uploaded.mimeType },
      outputs,
      (stage) => setJobStage(jobId, stage)
    );

    setCachedResult(cacheKey, result);
    // Keep the Gemini file alive (don't delete it below) so the user can
    // ask follow-up questions about the video via the chat endpoint.
    completeJob(jobId, result, false, {
      fileUri: uploaded.uri,
      mimeType: uploaded.mimeType,
      geminiFileName: uploaded.name,
    });
    succeeded = true;
  } catch (err) {
    handleJobError(jobId, err);
  } finally {
    safeUnlink(file.path);
    // Only clean up the Gemini-hosted file if processing failed (or a cache
    // hit meant nothing was uploaded). On success we keep it for chat; the
    // job cleanup interval deletes it later once the job itself expires.
    if (geminiFileName && !succeeded) void deleteUploadedFile(geminiFileName);
  }
}

/** Background processing for a video URL (YouTube or direct link). */
async function processVideoUrl(
  jobId: string,
  url: string,
  isYouTube: boolean,
  outputs: OutputType[]
) {
  let tempFilePath: string | undefined;
  let geminiFileName: string | undefined;
  let succeeded = false;

  try {
    const cacheKey = buildCacheKeyFromUrl(url, outputs);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setJobStage(jobId, 'uploading');
      // For YouTube links we can still chat using the same URL reference
      // even on a cache hit, since no Gemini file upload was needed.
      completeJob(
        jobId,
        cached,
        true,
        isYouTube ? { fileUri: url, mimeType: 'video/mp4' } : undefined
      );
      succeeded = true;
      return;
    }

    let videoRef: { fileUri: string; mimeType: string };

    if (isYouTube) {
      // Gemini can fetch and process YouTube videos directly when given the URL.
      setJobStage(jobId, 'uploading');
      setJobStage(jobId, 'extracting');
      videoRef = { fileUri: url, mimeType: 'video/mp4' };
    } else {
      setJobStage(jobId, 'uploading');
      const downloaded = await downloadVideoFromUrl(url, env.uploadDir);
      tempFilePath = downloaded.filePath;

      const uploaded = await uploadAndWaitForActiveFile(
        downloaded.filePath,
        downloaded.mimeType,
        `url-video`,
        (stage) => setJobStage(jobId, stage)
      );
      geminiFileName = uploaded.name;
      videoRef = { fileUri: uploaded.uri, mimeType: uploaded.mimeType };
    }

    const result = await analyzeVideo(videoRef, outputs, (stage) => setJobStage(jobId, stage));

    setCachedResult(cacheKey, result);
    // Keep the video reference alive for chat follow-ups (YouTube URLs need
    // no cleanup; uploaded Gemini files are kept until the job expires).
    completeJob(jobId, result, false, {
      fileUri: videoRef.fileUri,
      mimeType: videoRef.mimeType,
      geminiFileName,
    });
    succeeded = true;
  } catch (err) {
    handleJobError(jobId, err);
  } finally {
    safeUnlink(tempFilePath);
    if (geminiFileName && !succeeded) void deleteUploadedFile(geminiFileName);
  }
}

function handleJobError(jobId: string, err: unknown) {
  if (err instanceof AppError) {
    failJob(jobId, err.message);
  } else {
    const error = err as Error;
    logger.error(`Job ${jobId} failed`, error);
    failJob(jobId, 'An unexpected error occurred while processing the video.');
  }
}

const MAX_QUESTION_LENGTH = 1000;
const MAX_CHAT_HISTORY_TURNS = 20;

/**
 * POST /api/video/chat
 *
 * Lets the user ask a free-form follow-up question about a video they've
 * already had analyzed (identified by jobId). Reuses the same video
 * reference Gemini already has, so no re-upload is needed.
 */
export async function chatWithVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId, question, history } = req.body ?? {};

    if (typeof jobId !== 'string' || !jobId.trim()) {
      throw AppError.badRequest('A jobId is required to chat about a video.', 'CHAT_MISSING_JOB_ID');
    }

    if (typeof question !== 'string' || !question.trim()) {
      throw AppError.badRequest('Please enter a question.', 'CHAT_EMPTY_QUESTION');
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      throw AppError.badRequest(
        `Questions must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
        'CHAT_QUESTION_TOO_LONG'
      );
    }

    const job = getJob(jobId);
    if (!job) {
      throw AppError.notFound(
        'This summary session has expired. Please re-generate the summary to keep chatting.',
        'JOB_NOT_FOUND'
      );
    }

    if (!job.videoRef) {
      throw AppError.badRequest(
        'Chat is not available for this summary (it may have been served from cache or the session expired). Please re-generate the summary to enable chat.',
        'CHAT_UNAVAILABLE'
      );
    }

    const sanitizedHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (turn): turn is ChatMessage =>
              turn &&
              (turn.role === 'user' || turn.role === 'model') &&
              typeof turn.text === 'string' &&
              turn.text.trim().length > 0
          )
          .slice(-MAX_CHAT_HISTORY_TURNS)
      : [];

    const answer = await chatAboutVideo(job.videoRef, question.trim(), sanitizedHistory);

    res.json({ answer });
  } catch (err) {
    next(err);
  }
}

/** Re-export type for controllers/tests that need the result shape. */
export type { VideoAnalysisResult };
