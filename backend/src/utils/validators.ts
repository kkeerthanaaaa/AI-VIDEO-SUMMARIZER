import { AppError } from './AppError';
import { ALL_OUTPUT_TYPES, OutputType } from '../types';

/** MIME types accepted for direct file uploads */
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
  'video/webm',
];

/** File extensions accepted (used as a secondary check / for error messages) */
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

const YOUTUBE_HOST_PATTERN = /(^|\.)(youtube\.com|youtu\.be|m\.youtube\.com)$/i;

/**
 * Validates that the provided mimetype/extension is an allowed video format.
 */
export function isAllowedVideoMime(mimetype: string): boolean {
  return ALLOWED_VIDEO_MIME_TYPES.includes(mimetype.toLowerCase());
}

/**
 * Parses and validates the "outputs" field sent by the client.
 * Accepts either a JSON array, a comma separated string, or repeated form fields.
 */
export function parseOutputTypes(raw: unknown): OutputType[] {
  let values: string[] = [];

  if (Array.isArray(raw)) {
    values = raw.map(String);
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      values = Array.isArray(parsed) ? parsed.map(String) : raw.split(',');
    } catch {
      values = raw.split(',');
    }
  }

  const cleaned = values
    .map((v) => v.trim())
    .filter((v): v is OutputType => (ALL_OUTPUT_TYPES as string[]).includes(v));

  const unique = Array.from(new Set(cleaned));

  if (unique.length === 0) {
    throw AppError.badRequest(
      'Please select at least one output format (Summary, Flashcards, Key Points, or Highlights).',
      'NO_OUTPUTS_SELECTED'
    );
  }

  return unique;
}

/**
 * Validates a video URL. Returns metadata describing whether it's a YouTube
 * link (which Gemini can fetch natively) or a generic direct video URL
 * (which the backend will need to download before sending to Gemini).
 */
export function validateVideoUrl(rawUrl: string): {
  url: string;
  isYouTube: boolean;
} {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw AppError.badRequest('The video link is not a valid URL.', 'INVALID_URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw AppError.badRequest(
      'Only http/https video links are supported.',
      'INVALID_URL_PROTOCOL'
    );
  }

  const isYouTube = YOUTUBE_HOST_PATTERN.test(parsed.hostname);

  return { url: parsed.toString(), isYouTube };
}

/**
 * Returns a friendly description of allowed formats for error messages.
 */
export function describeAllowedFormats(): string {
  return ALLOWED_VIDEO_EXTENSIONS.join(', ').toUpperCase();
}
