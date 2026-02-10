import { useState } from 'react';

import { usePerfTelemetryStore } from '@/stores/usePerfTelemetryStore';
import { shouldShowPerfPanel } from '@/utils/perfTelemetry';

const panelEnabled = shouldShowPerfPanel();

function formatMs(value?: number): string {
  if (value == null || Number.isNaN(value)) return '--';
  return `${value.toFixed(1)} ms`;
}

function formatCount(value?: number): string {
  if (value == null || Number.isNaN(value)) return '--';
  return String(value);
}

export default function PerfTelemetryPanel() {
  const [expanded, setExpanded] = useState(false);
  const firstPaintMs = usePerfTelemetryStore((s) => s.firstPaintMs);
  const firstContentfulPaintMs = usePerfTelemetryStore((s) => s.firstContentfulPaintMs);
  const variants = usePerfTelemetryStore((s) => s.variants);
  const images = usePerfTelemetryStore((s) => s.images);

  if (!panelEnabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 9999,
        maxWidth: 320,
        borderRadius: 8,
        border: '1px solid #2f3b4f',
        background: 'rgba(8, 12, 20, 0.92)',
        color: '#e7eefb',
        fontSize: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          textAlign: 'left',
          border: 0,
          background: 'transparent',
          color: 'inherit',
          padding: '8px 10px',
          cursor: 'pointer',
        }}
      >
        {expanded ? 'Perf telemetry [-]' : 'Perf telemetry [+]'}
      </button>

      {expanded && (
        <div style={{ padding: '0 10px 10px 10px', lineHeight: 1.6 }}>
          <div><strong>Paint</strong></div>
          <div>FP: {formatMs(firstPaintMs)}</div>
          <div>FCP: {formatMs(firstContentfulPaintMs)}</div>

          <div style={{ marginTop: 8 }}><strong>Variants pipeline</strong></div>
          <div>Fetch: {formatMs(variants?.fetchedMs)}</div>
          <div>Transform: {formatMs(variants?.transformMs)}</div>
          <div>Queue persist: {formatMs(variants?.persistMs)}</div>
          <div>Commit write: {formatMs(variants?.persistCommittedMs)}</div>
          <div>Queue→commit: {formatMs(variants?.persistEndToEndMs)}</div>
          <div>Total: {formatMs(variants?.totalMs)}</div>
          <div>Count: {formatCount(variants?.variantCount)}</div>

          <div style={{ marginTop: 8 }}><strong>Image timing</strong></div>
          <div>Loads: {images.loads}</div>
          <div>Errors: {images.errors}</div>
          <div>Last load: {formatMs(images.lastLoadMs)}</div>
          <div>Avg load: {formatMs(images.avgLoadMs)}</div>
          <div>P95 load: {formatMs(images.p95LoadMs)}</div>
        </div>
      )}
    </div>
  );
}
