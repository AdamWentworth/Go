import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const sharp = require('sharp');

const FRAME_COUNT = 36;
const FRAME_SIZE = 84;
const FRAME_DELAYS_MS = Array.from(
  { length: FRAME_COUNT },
  (_, frame) => (frame % 3 === 2 ? 34 : 33),
);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetsDirectory = path.resolve(scriptDirectory, '../assets');

const sourceFrameOffset = (png, frame, x, y) => {
  const frameIndex = png.height === FRAME_SIZE ? frame : frame * 2;
  const columns = png.width / FRAME_SIZE;
  const column = frameIndex % columns;
  const row = Math.floor(frameIndex / columns);
  return (((row * FRAME_SIZE) + y) * png.width
    + (column * FRAME_SIZE) + x) * 4;
};

const horizontalFrameOffset = (frame, x, y) => (
  ((y * FRAME_COUNT * FRAME_SIZE) + (frame * FRAME_SIZE) + x) * 4
);

const verticalFrameOffset = (frame, x, y) => (
  ((((frame * FRAME_SIZE) + y) * FRAME_SIZE) + x) * 4
);

const extractCanonicalFrames = (source) => {
  const canonicalStrip = new PNG({
    height: FRAME_SIZE,
    width: FRAME_COUNT * FRAME_SIZE,
  });
  const verticalFrames = Buffer.alloc(FRAME_COUNT * FRAME_SIZE * FRAME_SIZE * 4);

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    for (let y = 0; y < FRAME_SIZE; y += 1) {
      for (let x = 0; x < FRAME_SIZE; x += 1) {
        const sourceOffset = sourceFrameOffset(source, frame, x, y);
        const stripOffset = horizontalFrameOffset(frame, x, y);
        const verticalOffset = verticalFrameOffset(frame, x, y);
        for (let channel = 0; channel < 4; channel += 1) {
          const value = source.data[sourceOffset + channel];
          canonicalStrip.data[stripOffset + channel] = value;
          verticalFrames[verticalOffset + channel] = value;
        }
      }
    }
  }

  return { canonicalStrip, verticalFrames };
};

const assertSourceGeometry = (source, fileName) => {
  const sourceFrames = (source.width / FRAME_SIZE) * (source.height / FRAME_SIZE);
  if (
    source.width % FRAME_SIZE !== 0
    || source.height % FRAME_SIZE !== 0
    || (sourceFrames !== FRAME_COUNT && sourceFrames !== FRAME_COUNT * 2)
  ) {
    throw new Error(
      `Unexpected spinner sheet geometry for ${fileName}: ${source.width}x${source.height}`,
    );
  }
};

const collapseDuplicateFrames = (canonicalFrames) => {
  const compactFrames = [];
  const compactDelays = [];
  const frameByteLength = FRAME_SIZE * FRAME_SIZE * 4;
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const pixels = canonicalFrames.subarray(
      frame * frameByteLength,
      (frame + 1) * frameByteLength,
    );
    const prior = compactFrames.at(-1);
    if (prior?.equals(pixels)) {
      compactDelays[compactDelays.length - 1] += FRAME_DELAYS_MS[frame];
    } else {
      compactFrames.push(Buffer.from(pixels));
      compactDelays.push(FRAME_DELAYS_MS[frame]);
    }
  }
  return {
    delays: compactDelays,
    frames: Buffer.concat(compactFrames),
  };
};

const assertAnimatedWebp = async (filePath, canonicalFrames) => {
  const expected = collapseDuplicateFrames(canonicalFrames);
  const metadata = await sharp(filePath, { animated: true }).metadata();
  const duration = metadata.delay?.reduce((total, delay) => total + delay, 0);
  if (
    metadata.pages !== expected.delays.length
    || metadata.pageHeight !== FRAME_SIZE
    || duration !== 1200
    || metadata.delay?.some((delay, frame) => delay !== expected.delays[frame])
  ) {
    throw new Error(`Invalid animated WebP metadata for ${path.basename(filePath)}`);
  }

  const decoded = await sharp(filePath, { animated: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (
    decoded.info.width !== FRAME_SIZE
    || decoded.info.height !== expected.delays.length * FRAME_SIZE
    || !decoded.data.equals(expected.frames)
  ) {
    throw new Error(`Animated WebP pixels diverged for ${path.basename(filePath)}`);
  }
};

const buildAnimatedWebp = async (stripFileName, webpFileName) => {
  const stripPath = path.join(assetsDirectory, stripFileName);
  const source = PNG.sync.read(fs.readFileSync(stripPath));
  assertSourceGeometry(source, stripFileName);
  const { canonicalStrip, verticalFrames } = extractCanonicalFrames(source);

  // The original migration sheet contained one synthetic blend between every
  // canonical frame. Keep only the 36 Vite frames as the reproducible source.
  if (source.height !== FRAME_SIZE) {
    fs.writeFileSync(stripPath, PNG.sync.write(canonicalStrip));
  }

  const webpPath = path.join(assetsDirectory, webpFileName);
  await sharp(verticalFrames, {
    raw: {
      channels: 4,
      height: FRAME_COUNT * FRAME_SIZE,
      pageHeight: FRAME_SIZE,
      width: FRAME_SIZE,
    },
  })
    .webp({
      delay: FRAME_DELAYS_MS,
      effort: 6,
      exact: true,
      lossless: true,
      loop: 0,
      minSize: true,
    })
    .toFile(webpPath);

  await assertAnimatedWebp(webpPath, verticalFrames);
};

await Promise.all([
  buildAnimatedWebp('loading-spinner-dark-strip.png', 'loading-spinner-dark.webp'),
  buildAnimatedWebp('loading-spinner-light-strip.png', 'loading-spinner-light.webp'),
]);
