import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const env = {
  port: getEnvNumber('PORT', 5000),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isProduction: getEnv('NODE_ENV', 'development') === 'production',

  corsOrigin: getEnv('CORS_ORIGIN', '*'),

  geminiApiKey: getEnv('GEMINI_API_KEY', ''),
  geminiModel: getEnv('GEMINI_MODEL', 'gemini-2.0-flash'),

  maxFileSizeBytes: getEnvNumber('MAX_FILE_SIZE_BYTES', 200 * 1024 * 1024),
  uploadDir: path.resolve(process.cwd(), getEnv('UPLOAD_DIR', 'uploads')),

  rateLimitWindowMinutes: getEnvNumber('RATE_LIMIT_WINDOW_MINUTES', 15),
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 20),

  cacheTtlSeconds: getEnvNumber('CACHE_TTL_SECONDS', 86400),
  jobTtlSeconds: getEnvNumber('JOB_TTL_SECONDS', 3600),
};

export function assertGeminiConfigured(): void {
  if (!env.geminiApiKey || env.geminiApiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Set it in your backend .env file.'
    );
  }
}
