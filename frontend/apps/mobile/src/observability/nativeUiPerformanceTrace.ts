import { logDebug } from './logger';
import { runtimeConfig } from '../config/runtimeConfig';

let flowStartedAt: number | null = null;

export const markNativeUiPerformance = (
  event: string,
  meta?: Record<string, unknown>,
): void => {
  if ((!__DEV__ && !runtimeConfig.mobile.deviceSmokeMode) || process.env.NODE_ENV === 'test') return;
  const now = Date.now();
  if (event === 'action_menu_anchor_pressed' || event === 'home_link_pressed') {
    flowStartedAt = now;
  }
  const payload = {
    elapsedFromAnchorMs: flowStartedAt === null ? null : now - flowStartedAt,
    ...meta,
  };
  if (__DEV__) {
    logDebug('ui-perf', event, payload);
    return;
  }
  // A minified device-smoke bundle deliberately has __DEV__ disabled so its
  // timings resemble the user's development client. Keep this narrow probe
  // observable through adb without enabling React's development overhead.
  console.info(`[mobile:ui-perf] ${event}`, payload);
};
