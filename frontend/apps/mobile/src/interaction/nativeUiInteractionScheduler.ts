type IdleCallbackHandle = number;

type IdleSchedulerGlobal = typeof globalThis & {
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => IdleCallbackHandle;
};

type ScheduledWork = {
  cancelled: boolean;
  idleHandle: IdleCallbackHandle | null;
  task: () => void;
  timer: ReturnType<typeof setTimeout> | null;
};

const pendingWork = new Set<ScheduledWork>();
let activeInteractionCount = 0;

const runScheduledWork = (work: ScheduledWork) => {
  work.idleHandle = null;
  work.timer = null;
  if (work.cancelled) return;
  if (activeInteractionCount > 0) {
    pendingWork.add(work);
    return;
  }
  work.task();
};

const scheduleWork = (work: ScheduledWork) => {
  if (work.cancelled) return;
  if (activeInteractionCount > 0) {
    pendingWork.add(work);
    return;
  }
  const idleGlobal = globalThis as IdleSchedulerGlobal;
  if (idleGlobal.requestIdleCallback) {
    work.idleHandle = idleGlobal.requestIdleCallback(
      () => runScheduledWork(work),
      { timeout: 250 },
    );
    return;
  }
  work.timer = setTimeout(() => runScheduledWork(work), 0);
};

const flushPendingWork = () => {
  if (activeInteractionCount > 0 || pendingWork.size === 0) return;
  const ready = [...pendingWork];
  pendingWork.clear();
  ready.forEach(scheduleWork);
};

/**
 * Holds low-priority native UI work until a gesture or page animation ends.
 * The returned release function is idempotent so cancellation paths are safe.
 */
export const beginNativeUiInteraction = (): (() => void) => {
  activeInteractionCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeInteractionCount = Math.max(0, activeInteractionCount - 1);
    flushPendingWork();
  };
};

export const runAfterNativeUiInteractions = (task: () => void): { cancel: () => void } => {
  const work: ScheduledWork = {
    cancelled: false,
    idleHandle: null,
    task,
    timer: null,
  };
  scheduleWork(work);
  return {
    cancel: () => {
      if (work.cancelled) return;
      work.cancelled = true;
      pendingWork.delete(work);
      if (work.timer) clearTimeout(work.timer);
      if (work.idleHandle != null) {
        const idleGlobal = globalThis as IdleSchedulerGlobal;
        idleGlobal.cancelIdleCallback?.(work.idleHandle);
      }
      work.idleHandle = null;
      work.timer = null;
    },
  };
};
