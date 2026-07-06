#!/usr/bin/env node

import { spawn } from 'node:child_process';

console.log(
  'Live workflow capture creates disposable test accounts, records Pokemon workflows, and deletes each account before finishing.',
);
console.log(
  'Service workers are blocked during workflow recording, so Pokemon instance edits stay in the disposable browser session and are not batch-synced to the backend.',
);
console.log(
  'Workflow capture defaults to five flows across dark/light themes and desktop/mobile viewports, producing four variants per flow.',
);
console.log(
  'Set DEMO_WORKFLOW_THEMES, DEMO_WORKFLOW_VIEWPORTS, or DEMO_WORKFLOW_FLOWS to narrow a run.',
);
console.log(
  'Workflow videos are capped at DEMO_WORKFLOW_VIDEO_MAX_SECONDS, defaulting to just under 20 seconds.',
);
console.log(
  'Trade-target workflow videos use DEMO_WORKFLOW_TARGET_VIDEO_MAX_SECONDS, defaulting to just under 28 seconds so target filtering is not truncated.',
);
console.log(
  'The instance-edit workflow uses DEMO_WORKFLOW_EDIT_VIDEO_MAX_SECONDS, defaulting to just under 25 seconds so the saved state is visible.',
);
console.log(
  `Capturing web surface: ${process.env.E2E_BASE_URL ?? 'https://pokegonexus.com'}`,
);

const env = {
  ...process.env,
  DEMO_WORKFLOW_CAPTURE_LIVE: '1',
  E2E_BASE_URL: process.env.E2E_BASE_URL ?? 'https://pokegonexus.com',
  E2E_PORT: process.env.E2E_PORT ?? '3014',
  E2E_REAL_API_ORIGIN: process.env.E2E_REAL_API_ORIGIN ?? 'https://pokegonexus.com',
  E2E_SKIP_WEBSERVER: process.env.E2E_SKIP_WEBSERVER ?? '1',
  E2E_USE_REAL_APIS: '1',
  E2E_FAIL_ON_CONSOLE: '0',
};

const child = spawn(
  process.execPath,
  [
    'scripts/run-playwright-clean-env.mjs',
    'test',
    'tests/browser/demo-live-capture.spec.ts',
    '--project=chromium-desktop',
    '--reporter=list',
    ...process.argv.slice(2),
  ],
  {
    env,
    shell: false,
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
