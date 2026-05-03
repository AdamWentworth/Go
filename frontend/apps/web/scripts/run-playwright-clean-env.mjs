#!/usr/bin/env node

import { spawn } from 'node:child_process';

const scrubbedPrefixes = ['GIO_', 'GTK_', 'SNAP_'];
const scrubbedNames = new Set(['SNAP']);
const env = { ...process.env };

for (const key of Object.keys(env)) {
  if (scrubbedNames.has(key) || scrubbedPrefixes.some((prefix) => key.startsWith(prefix))) {
    delete env[key];
  }
}

const args = process.argv.slice(2);
const child = spawn('playwright', args, {
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

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
