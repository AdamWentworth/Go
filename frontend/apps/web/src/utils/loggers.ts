// loggers.ts

import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Loggers');

export function logSize(label: string, data: unknown) {
  try {
    const size = new Blob([JSON.stringify(data)]).size;
    log.debug(`${label} size in bytes: ${size}`);
  } catch (err) {
    log.debug(`Error measuring size of ${label}:`, err);
  }
}
