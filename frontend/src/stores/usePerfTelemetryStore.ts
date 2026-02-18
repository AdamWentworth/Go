import { create } from 'zustand';

type VariantPipelineMetrics = {
  fetchedMs: number;
  transformMs: number;
  persistMs: number;
  persistCommittedMs?: number;
  persistEndToEndMs?: number;
  totalMs: number;
  variantCount: number;
  capturedAt: number;
};

type ImageMetrics = {
  loads: number;
  errors: number;
  avgLoadMs: number;
  p95LoadMs: number;
  lastLoadMs?: number;
};

type RenderProfileMetric = {
  commits: number;
  mounts: number;
  updates: number;
  avgMs: number;
  p95Ms: number;
  lastMs: number;
};

type PerfTelemetryState = {
  firstPaintMs?: number;
  firstContentfulPaintMs?: number;
  variants?: VariantPipelineMetrics;
  images: ImageMetrics;
  imageSamplesMs: number[];
  renders: Record<string, RenderProfileMetric>;
  renderSamplesById: Record<string, number[]>;
  setFirstPaintMs: (value: number) => void;
  setFirstContentfulPaintMs: (value: number) => void;
  setVariantPipeline: (value: Omit<VariantPipelineMetrics, 'capturedAt'>) => void;
  setVariantPersistCommit: (value: {
    persistCommittedMs: number;
    persistEndToEndMs: number;
  }) => void;
  recordImageLoadMs: (value: number) => void;
  recordImageError: () => void;
  recordRenderCommit: (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    durationMs: number,
  ) => void;
};

const IMAGE_SAMPLE_LIMIT = 120;
const RENDER_SAMPLE_LIMIT = 120;

function calculateAverage(values: number[]): number {
  if (!values.length) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return sum / values.length;
}

function calculateP95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[index] ?? 0;
}

export const usePerfTelemetryStore = create<PerfTelemetryState>((set) => ({
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

  setFirstPaintMs: (value) =>
    set((state) => ({
      firstPaintMs: state.firstPaintMs ?? value,
    })),

  setFirstContentfulPaintMs: (value) =>
    set((state) => ({
      firstContentfulPaintMs: state.firstContentfulPaintMs ?? value,
    })),

  setVariantPipeline: (value) =>
    set(() => ({
      variants: {
        ...value,
        persistCommittedMs: undefined,
        persistEndToEndMs: undefined,
        capturedAt: Date.now(),
      },
    })),

  setVariantPersistCommit: ({ persistCommittedMs, persistEndToEndMs }) =>
    set((state) => {
      if (!state.variants) return state;
      return {
        variants: {
          ...state.variants,
          persistCommittedMs,
          persistEndToEndMs,
        },
      };
    }),

  recordImageLoadMs: (value) =>
    set((state) => {
      const imageSamplesMs = [...state.imageSamplesMs, value].slice(-IMAGE_SAMPLE_LIMIT);
      return {
        imageSamplesMs,
        images: {
          loads: state.images.loads + 1,
          errors: state.images.errors,
          avgLoadMs: calculateAverage(imageSamplesMs),
          p95LoadMs: calculateP95(imageSamplesMs),
          lastLoadMs: value,
        },
      };
    }),

  recordImageError: () =>
    set((state) => ({
      images: {
        ...state.images,
        errors: state.images.errors + 1,
      },
    })),

  recordRenderCommit: (id, phase, durationMs) =>
    set((state) => {
      if (!id || !Number.isFinite(durationMs) || durationMs < 0) return state;

      const existingSamples = state.renderSamplesById[id] ?? [];
      const nextSamples = [...existingSamples, durationMs].slice(-RENDER_SAMPLE_LIMIT);

      const previous = state.renders[id];
      const commits = (previous?.commits ?? 0) + 1;
      const mounts = (previous?.mounts ?? 0) + (phase === 'mount' ? 1 : 0);
      const updates =
        (previous?.updates ?? 0) + (phase === 'update' || phase === 'nested-update' ? 1 : 0);

      return {
        renderSamplesById: {
          ...state.renderSamplesById,
          [id]: nextSamples,
        },
        renders: {
          ...state.renders,
          [id]: {
            commits,
            mounts,
            updates,
            avgMs: calculateAverage(nextSamples),
            p95Ms: calculateP95(nextSamples),
            lastMs: durationMs,
          },
        },
      };
    }),
}));

export type { VariantPipelineMetrics, ImageMetrics, RenderProfileMetric };
