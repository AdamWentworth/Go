import type { ErrorInfo } from 'react';
import { createScopedLogger } from '@/utils/logger';

type AppErrorLogPayload = {
  scope: string;
  message: string;
  stack?: string;
  componentStack?: string;
};

const log = createScopedLogger('AppErrorBoundary');

export function logAppError(error: Error, errorInfo?: ErrorInfo, scope = 'app-shell'): void {
  const payload: AppErrorLogPayload = {
    scope,
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack ?? undefined,
  };

  log.error('Unhandled render error', payload);
}
