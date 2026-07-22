import { describe, expect, it, vi } from 'vitest';

import { schedulePokedexScrollRestore } from '@/pages/Pokedex/pokedexScrollRestoration';

describe('schedulePokedexScrollRestore', () => {
  it('reapplies the saved position while the returning region grid settles', () => {
    const frames = new Map<number, FrameRequestCallback>();
    const delays = new Map<number, () => void>();
    const apply = vi.fn();
    let nextId = 1;

    const cleanup = schedulePokedexScrollRestore(761, {
      apply,
      requestFrame: (callback) => {
        const id = nextId++;
        frames.set(id, callback);
        return id;
      },
      cancelFrame: (id) => frames.delete(id),
      setDelay: (callback) => {
        const id = nextId++;
        delays.set(id, callback);
        return id;
      },
      clearDelay: (id) => delays.delete(id),
    });

    expect(frames.size).toBe(1);
    expect(delays.size).toBe(2);

    const runNextFrame = () => {
      const [id, callback] = frames.entries().next().value as [number, FrameRequestCallback];
      frames.delete(id);
      callback(0);
    };
    const runNextDelay = () => {
      const [id, callback] = delays.entries().next().value as [number, () => void];
      delays.delete(id);
      callback();
    };

    runNextFrame();
    runNextDelay();
    runNextFrame();
    runNextDelay();
    runNextFrame();

    expect(apply).toHaveBeenCalledTimes(3);
    expect(apply).toHaveBeenNthCalledWith(1, 761);
    expect(apply).toHaveBeenNthCalledWith(2, 761);
    expect(apply).toHaveBeenNthCalledWith(3, 761);

    cleanup();
    expect(frames.size).toBe(0);
    expect(delays.size).toBe(0);
  });
});
