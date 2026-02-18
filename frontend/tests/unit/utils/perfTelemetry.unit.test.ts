import { beforeEach, describe, expect, it } from 'vitest';

import { usePerfTelemetryStore } from '@/stores/usePerfTelemetryStore';
import { getPerfTelemetrySnapshot } from '@/utils/perfTelemetry';

describe('getPerfTelemetrySnapshot', () => {
  beforeEach(() => {
    usePerfTelemetryStore.setState({
      firstPaintMs: undefined,
      firstContentfulPaintMs: undefined,
      variants: undefined,
      images: {
        loads: 0,
        errors: 0,
        avgLoadMs: 0,
        p95LoadMs: 0,
        lastLoadMs: undefined,
      },
      imageSamplesMs: [],
      renders: {},
      renderSamplesById: {},
    });
  });

  it('returns current telemetry values with sample count', () => {
    usePerfTelemetryStore.setState({
      firstPaintMs: 420,
      firstContentfulPaintMs: 440,
      variants: {
        fetchedMs: 150,
        transformMs: 30,
        persistMs: 300,
        persistCommittedMs: 1000,
        persistEndToEndMs: 1400,
        totalMs: 700,
        variantCount: 3471,
        capturedAt: 1770678424675,
      },
      images: {
        loads: 48,
        errors: 0,
        avgLoadMs: 186.1,
        p95LoadMs: 208.8,
        lastLoadMs: 335.3,
      },
      imageSamplesMs: [10, 20, 30, 40],
      renders: {
        'Search.ListView': {
          commits: 3,
          mounts: 1,
          updates: 2,
          avgMs: 2.2,
          p95Ms: 3.1,
          lastMs: 2.8,
        },
      },
      renderSamplesById: {
        'Search.ListView': [1.2, 2.8, 2.6],
      },
    });

    const snapshot = getPerfTelemetrySnapshot();

    expect(snapshot.firstPaintMs).toBe(420);
    expect(snapshot.firstContentfulPaintMs).toBe(440);
    expect(snapshot.variants?.variantCount).toBe(3471);
    expect(snapshot.images.loads).toBe(48);
    expect(snapshot.images.sampleCount).toBe(4);
    expect(snapshot.renders['Search.ListView']?.commits).toBe(3);
    expect(new Date(snapshot.capturedAtIso).toString()).not.toBe('Invalid Date');
  });

  it('returns defaults when no telemetry has been recorded yet', () => {
    const snapshot = getPerfTelemetrySnapshot();

    expect(snapshot.firstPaintMs).toBeUndefined();
    expect(snapshot.firstContentfulPaintMs).toBeUndefined();
    expect(snapshot.variants).toBeUndefined();
    expect(snapshot.images.loads).toBe(0);
    expect(snapshot.images.errors).toBe(0);
    expect(snapshot.images.sampleCount).toBe(0);
    expect(snapshot.renders).toEqual({});
  });

  it('aggregates render commit metrics in store', () => {
    const state = usePerfTelemetryStore.getState();
    state.recordRenderCommit('Search.ListView', 'mount', 1.5);
    state.recordRenderCommit('Search.ListView', 'update', 2.5);
    state.recordRenderCommit('Search.ListView', 'update', 4.5);

    const snapshot = getPerfTelemetrySnapshot();
    const metrics = snapshot.renders['Search.ListView'];
    expect(metrics).toBeDefined();
    expect(metrics?.commits).toBe(3);
    expect(metrics?.mounts).toBe(1);
    expect(metrics?.updates).toBe(2);
    expect(metrics?.avgMs).toBeGreaterThan(2);
    expect(metrics?.p95Ms).toBeGreaterThanOrEqual(metrics?.lastMs ?? 0);
  });
});
