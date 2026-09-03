import { markNativeUiPerformance } from './nativeUiPerformanceTrace';

export const markNativeUiPerformanceAfterPaint = (
  event: string,
  startedAt: number,
): void => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      markNativeUiPerformance(event, {
        interactionLatencyMs: Math.max(0, Date.now() - startedAt),
      });
    });
  });
};
