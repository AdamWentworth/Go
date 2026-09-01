import { logDebug } from './logger';

let flowStartedAt: number | null = null;

export const markNativeUiPerformance = (
  event: string,
  meta?: Record<string, unknown>,
): void => {
  if (!__DEV__ || process.env.NODE_ENV === 'test') return;
  const now = Date.now();
  if (event === 'action_menu_anchor_pressed' || event === 'home_link_pressed') {
    flowStartedAt = now;
  }
  logDebug('ui-perf', event, {
    elapsedFromAnchorMs: flowStartedAt === null ? null : now - flowStartedAt,
    ...meta,
  });
};
