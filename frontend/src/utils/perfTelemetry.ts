import { usePerfTelemetryStore } from '@/stores/usePerfTelemetryStore';

type VariantPipelineMetricsInput = {
  fetchedMs: number;
  transformMs: number;
  persistMs: number;
  totalMs: number;
  variantCount: number;
};

const isPanelEnabled =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_PERF_PANEL === 'true';

let observersInitialized = false;

export function initPerfPaintObservers(): void {
  if (!isPanelEnabled || observersInitialized) return;
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  observersInitialized = true;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-paint') {
        usePerfTelemetryStore.getState().setFirstPaintMs(entry.startTime);
      }
      if (entry.name === 'first-contentful-paint') {
        usePerfTelemetryStore.getState().setFirstContentfulPaintMs(entry.startTime);
      }
    }
  });

  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch {
    observersInitialized = false;
  }
}

export function recordVariantPipelineMetrics(
  metrics: VariantPipelineMetricsInput,
): void {
  if (!isPanelEnabled) return;
  usePerfTelemetryStore.getState().setVariantPipeline(metrics);
}

export function recordVariantPersistCommitMetrics(metrics: {
  persistCommittedMs: number;
  persistEndToEndMs: number;
}): void {
  if (!isPanelEnabled) return;
  usePerfTelemetryStore.getState().setVariantPersistCommit(metrics);
}

export function recordImageLoadTimingMs(value: number): void {
  if (!isPanelEnabled || !Number.isFinite(value) || value < 0) return;
  usePerfTelemetryStore.getState().recordImageLoadMs(value);
}

export function recordImageLoadError(): void {
  if (!isPanelEnabled) return;
  usePerfTelemetryStore.getState().recordImageError();
}

export function shouldShowPerfPanel(): boolean {
  return isPanelEnabled;
}
