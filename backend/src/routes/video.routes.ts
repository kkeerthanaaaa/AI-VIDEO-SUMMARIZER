import { Router } from 'express';
import { chatWithVideo, getJobStatus, processVideo } from '../controllers/video.controller';
import { videoUpload } from '../middleware/upload.middleware';
import { chatRateLimiter, processRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * POST /api/video/process
 * multipart/form-data: { video?: File, url?: string, outputs: string|string[] }
 * Returns: { jobId: string }
 */
router.post('/process', processRateLimiter, videoUpload.single('video'), processVideo);

/**
 * GET /api/video/status/:jobId
 * Returns: { jobId, status, progress, message, result?, error?, fromCache, chatAvailable }
 */
router.get('/status/:jobId', getJobStatus);

/**
 * POST /api/video/chat
 * JSON body: { jobId: string, question: string, history?: { role: 'user'|'model', text: string }[] }
 * Returns: { answer: string }
 */
router.post('/chat', chatRateLimiter, chatWithVideo);

export default router;
