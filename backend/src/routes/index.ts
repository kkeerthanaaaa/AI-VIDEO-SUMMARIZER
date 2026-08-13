import { Router } from 'express';
import videoRoutes from './video.routes';
import { getCacheStats } from '../services/cache.service';
import { env } from '../config/env';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(env.geminiApiKey) && env.geminiApiKey !== 'your_gemini_api_key_here',
    cache: getCacheStats(),
  });
});

router.use('/video', videoRoutes);

export default router;
