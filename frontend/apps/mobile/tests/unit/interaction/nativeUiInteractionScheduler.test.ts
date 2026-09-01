import {
  beginNativeUiInteraction,
  runAfterNativeUiInteractions,
} from '../../../src/interaction/nativeUiInteractionScheduler';

describe('nativeUiInteractionScheduler', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('holds background work until the active interaction releases', () => {
    const task = jest.fn();
    const release = beginNativeUiInteraction();

    runAfterNativeUiInteractions(task);
    jest.runOnlyPendingTimers();
    expect(task).not.toHaveBeenCalled();

    release();
    jest.runOnlyPendingTimers();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('waits for every overlapping interaction', () => {
    const task = jest.fn();
    const releaseFirst = beginNativeUiInteraction();
    const releaseSecond = beginNativeUiInteraction();

    runAfterNativeUiInteractions(task);
    releaseFirst();
    jest.runOnlyPendingTimers();
    expect(task).not.toHaveBeenCalled();

    releaseSecond();
    jest.runOnlyPendingTimers();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('cancels queued work without leaking it into the next idle period', () => {
    const task = jest.fn();
    const release = beginNativeUiInteraction();
    const scheduled = runAfterNativeUiInteractions(task);

    scheduled.cancel();
    release();
    jest.runOnlyPendingTimers();

    expect(task).not.toHaveBeenCalled();
  });
});
