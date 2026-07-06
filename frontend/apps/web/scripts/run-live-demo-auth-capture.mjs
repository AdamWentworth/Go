#!/usr/bin/env node

import { spawn } from 'node:child_process';

console.log(
  'Live auth capture starts on Home, creates a disposable test account, records registration auto-login/account edit/deletion, and deletes the account before finishing.',
);
console.log(
  'No existing user credentials are used. If the visible deletion step fails, the runner attempts API cleanup before exiting.',
);
console.log(
  'Auth video capture defaults to dark and light themes across desktop and mobile, producing four variants.',
);
console.log(
  'Set DEMO_AUTH_THEMES or DEMO_AUTH_VIEWPORTS to narrow a run.',
);
console.log(
  'Auth videos are capped at DEMO_AUTH_VIDEO_MAX_SECONDS, defaulting to just under 30 seconds.',
);
console.log(
  'Set DEMO_AUTH_INCLUDE_EXPLICIT_LOGIN=1 for a longer logout/login/account/deletion variant.',
);
console.log(
  `Capturing web surface: ${process.env.E2E_BASE_URL ?? 'https://pokegonexus.com'}`,
);

const env = {
  ...process.env,
  DEMO_AUTH_CAPTURE_LIVE: '1',
  E2E_BASE_URL: process.env.E2E_BASE_URL ?? 'https://pokegonexus.com',
  E2E_PORT: process.env.E2E_PORT ?? '3013',
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
