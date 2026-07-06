#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Writable } from 'node:stream';

const allSteps = ['screenshots', 'videos', 'auth', 'workflows', 'posters'];
const credentialSteps = new Set(['screenshots', 'videos']);

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

function parseSteps() {
  const rawSteps = process.env.DEMO_MEDIA_STEPS;
  if (!rawSteps) return allSteps;

  const requestedSteps = rawSteps
    .split(',')
    .map((step) => step.trim())
    .filter(Boolean);
  const unknownSteps = requestedSteps.filter((step) => !allSteps.includes(step));

  if (unknownSteps.length > 0) {
    throw new Error(
      `Unknown DEMO_MEDIA_STEPS value(s): ${unknownSteps.join(', ')}. Valid steps: ${allSteps.join(', ')}`,
    );
  }

  return requestedSteps.length > 0 ? requestedSteps : allSteps;
}

async function resolveCredentials(steps) {
  if (!steps.some((step) => credentialSteps.has(step))) return {};

  console.log(
    'AdamZilla screenshots/videos perform a normal login. Guards block Pokemon, trade, and profile mutations, but auth session-token metadata may change.',
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

  return {
    POKEGONEXUS_DEMO_USERNAME: username,
    POKEGONEXUS_DEMO_PASSWORD: password,
  };
}

function runStep(label, script, env) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [script], {
    env,
    shell: false,
    stdio: 'inherit',
  });

  if (result.signal) {
    process.kill(process.pid, result.signal);
    return;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}.`);
  }
}

function countFiles(relativeDir, predicate) {
  const directory = path.resolve(process.cwd(), relativeDir);
  if (!fs.existsSync(directory)) return 0;

  return fs.readdirSync(directory).filter(predicate).length;
}

function printSummary() {
  const screenshotCount = countFiles('.artifacts/demo-media-live', (entry) =>
    entry.endsWith('.png'),
  );
  const posterCount = countFiles('.artifacts/demo-media-live/video-posters', (entry) =>
    entry.endsWith('.png'),
  );
  const videoCount = countFiles('.artifacts/demo-video-live', (entry) =>
    entry.endsWith('.webm') && !entry.endsWith('.raw.webm'),
  );

  console.log('\n=== Media summary ===');
  console.log(`Screenshots: ${screenshotCount}`);
  console.log(`Video posters: ${posterCount}`);
  console.log(`Videos: ${videoCount}`);
}

const stepDefinitions = {
  screenshots: {
    label: 'AdamZilla screenshots',
    script: 'scripts/run-live-demo-capture.mjs',
  },
  videos: {
    label: 'AdamZilla videos',
    script: 'scripts/run-live-demo-video-capture.mjs',
  },
  auth: {
    label: 'Disposable auth lifecycle videos',
    script: 'scripts/run-live-demo-auth-capture.mjs',
  },
  workflows: {
    label: 'Disposable Pokemon workflow videos',
    script: 'scripts/run-live-demo-workflow-capture.mjs',
  },
  posters: {
    label: 'Video poster images',
    script: 'scripts/run-live-demo-video-poster-capture.mjs',
  },
};

try {
  const steps = parseSteps();
  const credentials = await resolveCredentials(steps);
  const env = {
    ...process.env,
    ...credentials,
  };

  console.log(`Running demo media step(s): ${steps.join(', ')}`);
  console.log(`Capturing web surface: ${process.env.E2E_BASE_URL ?? 'https://pokegonexus.com'}`);

  for (const step of steps) {
    const definition = stepDefinitions[step];
    runStep(definition.label, definition.script, env);
  }

  printSummary();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
