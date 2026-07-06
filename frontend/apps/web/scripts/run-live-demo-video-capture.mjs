#!/usr/bin/env node

import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { Writable } from 'node:stream';

async function promptVisible(question) {
  if (!process.stdin.isTTY) {
    throw new Error(`Missing required environment value and cannot prompt: ${question}`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    return await new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });
  } finally {
    rl.close();
  }
}

async function promptHidden(question) {
  if (!process.stdin.isTTY) {
    throw new Error(`Missing required environment value and cannot prompt: ${question}`);
  }

  process.stdout.write(question);

  const mutedOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutedOutput,
    terminal: true,
  });

  try {
    return await new Promise((resolve) => {
      rl.question('', (answer) => resolve(answer));
    });
  } finally {
    rl.close();
    process.stdout.write('\n');
  }
}

async function resolveCredentials() {
  console.log(
    'Live video capture performs a normal login. The guard blocks Pokemon, trade, and profile mutations, but auth session-token metadata may change.',
  );
  console.log(
    'Video capture defaults to dark and light themes across desktop and mobile, producing four variants per flow.',
  );
  console.log(
    'Set DEMO_VIDEO_THEMES, DEMO_VIDEO_VIEWPORTS, or DEMO_VIDEO_FLOWS to narrow a run.',
  );
  console.log(
    'Videos are trimmed from the visual-ready frame and capped at DEMO_VIDEO_MAX_SECONDS, defaulting to just under 15 seconds.',
  );
  console.log(
    'Video output keeps the app viewport size; lower DEMO_VIDEO_CRF improves compression quality.',
  );
  console.log(
    `Capturing web surface: ${process.env.E2E_BASE_URL ?? 'https://pokegonexus.com'}`,
  );

  const username =
    process.env.POKEGONEXUS_DEMO_USERNAME ??
    String(await promptVisible('PokeGoNexus username/email: ')).trim();
  const password =
    process.env.POKEGONEXUS_DEMO_PASSWORD ??
    String(await promptHidden('PokeGoNexus password: '));

  if (!username || !password) {
    throw new Error(
      'Both POKEGONEXUS_DEMO_USERNAME and POKEGONEXUS_DEMO_PASSWORD are required.',
    );
  }

  return { username, password };
}

try {
  const { username, password } = await resolveCredentials();
  const env = {
    ...process.env,
    POKEGONEXUS_DEMO_USERNAME: username,
    POKEGONEXUS_DEMO_PASSWORD: password,
    DEMO_VIDEO_CAPTURE_LIVE: '1',
    E2E_BASE_URL: process.env.E2E_BASE_URL ?? 'https://pokegonexus.com',
    E2E_PORT: process.env.E2E_PORT ?? '3012',
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
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
