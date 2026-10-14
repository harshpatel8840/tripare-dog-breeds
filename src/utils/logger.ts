export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = __DEV__;

export const logger = {
  debug: (...args: unknown[]) => {
    if (IS_DEV) {
      console.info('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};
