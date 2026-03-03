import React, { Profiler } from 'react';

import {
  recordRenderCommitMetrics,
  shouldShowPerfPanel,
} from '@/utils/perfTelemetry';

type RenderProfilerProps = {
  id: string;
  children: React.ReactNode;
};

export function RenderProfiler({ id, children }: RenderProfilerProps) {
  if (!shouldShowPerfPanel()) {
    return <>{children}</>;
  }

  return (
    <Profiler
      id={id}
      onRender={(_id, phase, actualDuration) => {
        recordRenderCommitMetrics(id, phase, actualDuration);
      }}
    >
      {children}
    </Profiler>
  );
}
