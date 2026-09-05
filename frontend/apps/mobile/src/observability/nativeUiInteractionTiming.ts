import { markNativeUiPerformance } from './nativeUiPerformanceTrace';

export const markNativeUiPerformanceAfterPaint = (
  event: string,
  startedAt: number,
): void => {
  if (process.env.NODE_ENV === 'test') return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      markNativeUiPerformance(event, {
        interactionLatencyMs: Math.max(0, Date.now() - startedAt),
      });
    });
  });
};
