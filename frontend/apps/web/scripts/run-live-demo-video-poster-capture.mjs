#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpegStaticPath from 'ffmpeg-static';

const videoDir = path.resolve(process.cwd(), '.artifacts/demo-video-live');
const posterDir = path.resolve(
  process.cwd(),
  process.env.DEMO_POSTER_OUTPUT_DIR ?? '.artifacts/demo-media-live/video-posters',
);
const posterOffsetSeconds = process.env.DEMO_POSTER_OFFSET_SECONDS ?? '3';

function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (typeof ffmpegStaticPath === 'string' && ffmpegStaticPath.length > 0) {
    return ffmpegStaticPath;
  }

  throw new Error('Could not resolve ffmpeg. Set FFMPEG_PATH to generate demo video posters.');
}

function listVideoFiles() {
  if (!fs.existsSync(videoDir)) return [];

  return fs
    .readdirSync(videoDir)
    .filter((entry) => entry.endsWith('.webm') && !entry.endsWith('.raw.webm'))
    .sort();
}

function generatePoster(ffmpegPath, videoFile) {
  const videoPath = path.join(videoDir, videoFile);
  const posterPath = path.join(posterDir, videoFile.replace(/\.webm$/u, '.png'));
  const result = spawnSync(
    ffmpegPath,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-ss',
      posterOffsetSeconds,
      '-i',
      videoPath,
      '-frames:v',
      '1',
      posterPath,
    ],
    { stdio: 'pipe' },
  );

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? '';
    throw new Error(`Could not generate poster for ${videoFile}:\n${stderr}`);
  }
}

const videos = listVideoFiles();

if (videos.length === 0) {
  console.log(`No demo videos found in ${videoDir}. Run video capture first.`);
  process.exit(0);
}

fs.mkdirSync(posterDir, { recursive: true });
const ffmpegPath = resolveFfmpegPath();

for (const video of videos) {
  generatePoster(ffmpegPath, video);
}

console.log(`Generated ${videos.length} demo video poster image(s) in ${posterDir}.`);
