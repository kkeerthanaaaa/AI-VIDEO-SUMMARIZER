import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiter applied to the video processing endpoint to protect the
 * Gemini API quota and prevent abuse. Status responses follow the same
 * { error: { message, code } } shape as the rest of the API.
 */
export const processRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMinutes * 60 * 1000,
  max: env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many video requests. Please wait a while before trying again.',
      code: 'RATE_LIMITED',
    },
  },
});

/**
 * Rate limiter applied to the chat-about-video endpoint. More permissive
 * than video processing since each chat turn is a lighter Gemini call, but
 * still bounded to prevent runaway usage.
 */
export const chatRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMinutes * 60 * 1000,
  max: env.rateLimitMaxRequests * 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many chat messages. Please wait a while before trying again.',
      code: 'RATE_LIMITED',
    },
  },
});

/** A looser limiter for general API traffic (status polling, etc). */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests. Please slow down.',
      code: 'RATE_LIMITED',
    },
  },
});
