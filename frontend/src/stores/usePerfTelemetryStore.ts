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

type PerfTelemetryState = {
  firstPaintMs?: number;
  firstContentfulPaintMs?: number;
  variants?: VariantPipelineMetrics;
  images: ImageMetrics;
  imageSamplesMs: number[];
  setFirstPaintMs: (value: number) => void;
  setFirstContentfulPaintMs: (value: number) => void;
  setVariantPipeline: (value: Omit<VariantPipelineMetrics, 'capturedAt'>) => void;
  setVariantPersistCommit: (value: {
    persistCommittedMs: number;
    persistEndToEndMs: number;
  }) => void;
  recordImageLoadMs: (value: number) => void;
  recordImageError: () => void;
};

const IMAGE_SAMPLE_LIMIT = 120;

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
}));

export type { VariantPipelineMetrics, ImageMetrics };
