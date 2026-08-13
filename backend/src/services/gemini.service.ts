import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { env, assertGeminiConfigured } from '../config/env';
import { buildAnalysisPrompt, buildResponseSchema } from '../prompts/prompts';
import { ChatMessage, OutputType, VideoAnalysisResult } from '../types';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

let genAI: GoogleGenerativeAI | null = null;
let fileManager: GoogleAIFileManager | null = null;

function getClients() {
  assertGeminiConfigured();
  if (!genAI) genAI = new GoogleGenerativeAI(env.geminiApiKey);
  if (!fileManager) fileManager = new GoogleAIFileManager(env.geminiApiKey);
  return { genAI, fileManager };
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 75; // ~5 minutes

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ProgressCallback {
  (stage: 'uploading' | 'extracting' | 'analyzing' | 'generating'): void;
}

/**
 * Uploads a local video file to the Gemini Files API and waits until it has
 * finished processing (state === ACTIVE) before returning. Gemini needs the
 * video in an ACTIVE state before it can be referenced in generateContent.
 */
export async function uploadAndWaitForActiveFile(
  filePath: string,
  mimeType: string,
  displayName: string,
  onProgress?: ProgressCallback
): Promise<{ uri: string; mimeType: string; name: string }> {
  const { fileManager: fm } = getClients();

  onProgress?.('uploading');
  let uploadResponse;
  try {
    uploadResponse = await fm.uploadFile(filePath, { mimeType, displayName });
  } catch (err) {
    logger.error('Gemini file upload failed', err);
    throw AppError.upstream('Failed to upload the video to the AI service.');
  }

  let file = uploadResponse.file;
  onProgress?.('extracting');

  let attempts = 0;
  while (file.state === FileState.PROCESSING) {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw AppError.upstream('Timed out while the AI service processed the video.');
    }
    await sleep(POLL_INTERVAL_MS);
    try {
      file = await fm.getFile(uploadResponse.file.name);
    } catch (err) {
      logger.error('Gemini getFile failed', err);
      throw AppError.upstream('Failed to check video processing status.');
    }
    attempts += 1;
  }

  if (file.state === FileState.FAILED) {
    throw AppError.upstream('The AI service failed to process this video file.');
  }

  return { uri: file.uri, mimeType: file.mimeType, name: file.name };
}

/** Best-effort cleanup of a file previously uploaded to Gemini. */
export async function deleteUploadedFile(name: string): Promise<void> {
  try {
    const { fileManager: fm } = getClients();
    await fm.deleteFile(name);
  } catch (err) {
    logger.warn(`Failed to delete Gemini file ${name}`, err);
  }
}

/**
 * Downloads a direct (non-YouTube) video URL to a temporary local file so it
 * can be uploaded through the Gemini Files API. Enforces the same size limit
 * as direct uploads.
 */
export async function downloadVideoFromUrl(
  url: string,
  destDir: string
): Promise<{ filePath: string; mimeType: string }> {
  let response;
  try {
    response = await axios.get<NodeJS.ReadableStream>(url, {
      responseType: 'stream',
      maxContentLength: env.maxFileSizeBytes,
      maxRedirects: 5,
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (AI-Video-Summarizer)' },
      validateStatus: (status) => status >= 200 && status < 400,
    });
  } catch (err) {
    logger.error('Failed to fetch video URL', err);
    throw AppError.badRequest(
      'Could not download the video from the provided link. Please check the URL and try again.',
      'BROKEN_URL'
    );
  }

  const contentType = String(response.headers['content-type'] || '').split(';')[0].trim();
  if (contentType && !contentType.startsWith('video/')) {
    throw AppError.unsupportedMedia(
      `The link does not point to a supported video file (received content-type "${contentType}").`,
      'INVALID_URL_CONTENT_TYPE'
    );
  }

  const mimeType = contentType || 'video/mp4';
  const ext = mimeType.split('/')[1] || 'mp4';
  const filePath = path.join(destDir, `url-${Date.now()}.${ext}`);

  let total = 0;
  const writer = fs.createWriteStream(filePath);

  await new Promise<void>((resolve, reject) => {
    response!.data.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > env.maxFileSizeBytes) {
        writer.destroy();
        response!.data.destroy();
        reject(
          AppError.tooLarge(
            'The video at this link exceeds the maximum allowed size.',
            'FILE_TOO_LARGE'
          )
        );
      }
    });
    response!.data.on('error', (err: Error) => {
      reject(AppError.upstream(`Failed while downloading the video: ${err.message}`));
    });
    writer.on('error', (err) => reject(err));
    writer.on('finish', () => resolve());
    response!.data.pipe(writer);
  });

  return { filePath, mimeType };
}

/**
 * Runs the core Gemini analysis call given a video reference (either an
 * uploaded Gemini file URI, or a YouTube URL) and the user's selected
 * output types. Returns the parsed structured JSON result.
 */
export async function analyzeVideo(
  videoRef: { fileUri: string; mimeType: string },
  selectedOutputs: OutputType[],
  onProgress?: ProgressCallback
): Promise<VideoAnalysisResult> {
  const { genAI: client } = getClients();

  onProgress?.('analyzing');

  const model = client.getGenerativeModel({
    model: env.geminiModel,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(selectedOutputs) as any,
      temperature: 0.4,
    },
  });

  const prompt = buildAnalysisPrompt(selectedOutputs);

  let result;
  try {
    result = await model.generateContent([
      {
        fileData: {
          fileUri: videoRef.fileUri,
          mimeType: videoRef.mimeType,
        },
      },
      { text: prompt },
    ]);
  } catch (err: any) {
    logger.error('Gemini generateContent failed', err);
    const message = err?.message || 'Unknown error';
    if (/quota|rate/i.test(message)) {
      throw AppError.tooManyRequests(
        'The AI service is currently rate-limited. Please try again shortly.',
        'GEMINI_RATE_LIMITED'
      );
    }
    throw AppError.upstream('The AI service failed to analyze this video. Please try again.');
  }

  onProgress?.('generating');

  const text = result.response.text();

  let parsed: VideoAnalysisResult;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    logger.error('Failed to parse Gemini JSON response', text);
    throw AppError.upstream(
      'The AI service returned an unexpected response format. Please try again.'
    );
  }

  return parsed;
}

/**
 * Answers a free-form follow-up question about a video the user has already
 * had analyzed, using the same video reference (Gemini file or YouTube URL)
 * plus the prior chat turns for context.
 */
export async function chatAboutVideo(
  videoRef: { fileUri: string; mimeType: string },
  question: string,
  history: ChatMessage[] = []
): Promise<string> {
  const { genAI: client } = getClients();

  const model = client.getGenerativeModel({
    model: env.geminiModel,
    generationConfig: {
      temperature: 0.5,
    },
  });

  const systemInstruction = `You are a helpful assistant answering questions about a specific video the user has uploaded or linked. Base every answer strictly on the actual content of the video (visuals, on-screen text, and audio/narration). If the question cannot be answered from the video's content, say so politely rather than guessing. Keep answers clear, concise, and conversational (typically 1-6 sentences unless the user asks for more detail). Do not repeat the entire video transcript; answer the specific question asked.`;

  const historyContents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const contents = [
    {
      role: 'user' as const,
      parts: [
        {
          fileData: {
            fileUri: videoRef.fileUri,
            mimeType: videoRef.mimeType,
          },
        },
        { text: `${systemInstruction}\n\nFor context, this is the start of our conversation about this video.` },
      ],
    },
    ...historyContents,
    {
      role: 'user' as const,
      parts: [{ text: question }],
    },
  ];

  let result;
  try {
    result = await model.generateContent({ contents });
  } catch (err: any) {
    logger.error('Gemini chat generateContent failed', err);
    const message = err?.message || 'Unknown error';
    if (/quota|rate/i.test(message)) {
      throw AppError.tooManyRequests(
        'The AI service is currently rate-limited. Please try again shortly.',
        'GEMINI_RATE_LIMITED'
      );
    }
    throw AppError.upstream('The AI service failed to answer your question. Please try again.');
  }

  const answer = result.response.text().trim();
  if (!answer) {
    throw AppError.upstream('The AI service returned an empty answer. Please try again.');
  }
  return answer;
}
