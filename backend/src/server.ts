import { createApp } from './app';
import { env } from './config/env';
import { deleteUploadedFile } from './services/gemini.service';
import { startJobCleanup } from './services/job.service';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`AI Video Summarizer API listening on port ${env.port} (${env.nodeEnv})`);
  if (!env.geminiApiKey || env.geminiApiKey === 'your_gemini_api_key_here') {
    logger.warn(
      'GEMINI_API_KEY is not set. Video processing requests will fail until it is configured in .env'
    );
  }
  startJobCleanup((videoRef) => {
    if (videoRef.geminiFileName) void deleteUploadedFile(videoRef.geminiFileName);
  });
});
