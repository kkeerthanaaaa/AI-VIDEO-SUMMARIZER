/* eslint-disable no-console */

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (...args: unknown[]) => console.log(`[INFO] ${timestamp()}`, ...args),
  warn: (...args: unknown[]) => console.warn(`[WARN] ${timestamp()}`, ...args),
  error: (...args: unknown[]) => console.error(`[ERROR] ${timestamp()}`, ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()}`, ...args);
    }
  },
};
