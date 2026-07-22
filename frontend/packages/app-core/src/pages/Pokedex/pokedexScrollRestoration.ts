export interface PokedexScrollRestoreEnvironment {
  apply: (scrollTop: number) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (frameId: number) => void;
  setDelay: (callback: () => void, delayMs: number) => number;
  clearDelay: (timeoutId: number) => void;
}

const SCROLL_RESTORE_RETRY_DELAYS_MS = [120, 360];

function applyDocumentScrollTop(scrollTop: number) {
  window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });

  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = scrollTop;
  }

  document.documentElement.scrollTop = scrollTop;
  document.body.scrollTop = scrollTop;
}

const browserEnvironment: PokedexScrollRestoreEnvironment = {
  apply: applyDocumentScrollTop,
  requestFrame: (callback) => window.requestAnimationFrame(callback),
  cancelFrame: (frameId) => window.cancelAnimationFrame(frameId),
  setDelay: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearDelay: (timeoutId) => window.clearTimeout(timeoutId),
};

export function schedulePokedexScrollRestore(
  scrollTop: number,
  environment: PokedexScrollRestoreEnvironment = browserEnvironment,
): () => void {
  const pendingFrames = new Set<number>();
  const pendingDelays = new Set<number>();

  const requestRestore = () => {
    let frameId = 0;
    frameId = environment.requestFrame(() => {
      pendingFrames.delete(frameId);
      environment.apply(scrollTop);
    });
    pendingFrames.add(frameId);
  };

  requestRestore();

  for (const delayMs of SCROLL_RESTORE_RETRY_DELAYS_MS) {
    let timeoutId = 0;
    timeoutId = environment.setDelay(() => {
      pendingDelays.delete(timeoutId);
      requestRestore();
    }, delayMs);
    pendingDelays.add(timeoutId);
  }

  return () => {
    pendingFrames.forEach((frameId) => environment.cancelFrame(frameId));
    pendingDelays.forEach((timeoutId) => environment.clearDelay(timeoutId));
    pendingFrames.clear();
    pendingDelays.clear();
  };
}
