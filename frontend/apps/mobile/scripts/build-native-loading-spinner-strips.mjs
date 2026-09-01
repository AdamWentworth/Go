import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const { GIFEncoder, applyPalette, quantize } = require('gifenc');

const SOURCE_FRAME_COUNT = 36;
const SOURCE_FRAME_SIZE = 84;
const OUTPUT_COLUMNS = 36;
const OUTPUT_ROWS = 2;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetsDirectory = path.resolve(scriptDirectory, '../assets');

const sourcePixelOffset = (png, frame, x, y) => {
  const sourceColumns = png.width / SOURCE_FRAME_SIZE;
  const sourceFrame = png.height === SOURCE_FRAME_SIZE
    ? frame
    : frame * 2;
  const sourceColumn = sourceFrame % sourceColumns;
  const sourceRow = Math.floor(sourceFrame / sourceColumns);
  return (((sourceRow * SOURCE_FRAME_SIZE) + y) * png.width
    + (sourceColumn * SOURCE_FRAME_SIZE) + x) * 4;
};

const outputPixelOffset = (frame, x, y, outputWidth) => {
  const column = frame % OUTPUT_COLUMNS;
  const row = Math.floor(frame / OUTPUT_COLUMNS);
  return (((row * SOURCE_FRAME_SIZE) + y) * outputWidth
    + (column * SOURCE_FRAME_SIZE) + x) * 4;
};

const generatedPixelOffset = (frame, x, y, outputWidth) => {
  const column = frame % OUTPUT_COLUMNS;
  const row = Math.floor(frame / OUTPUT_COLUMNS);
  return (((row * SOURCE_FRAME_SIZE) + y) * outputWidth
    + (column * SOURCE_FRAME_SIZE) + x) * 4;
};

const writePixel = (target, offset, red, green, blue, alpha) => {
  target[offset] = Math.round(red);
  target[offset + 1] = Math.round(green);
  target[offset + 2] = Math.round(blue);
  target[offset + 3] = Math.round(alpha);
};

const blendPixel = (data, leftOffset, rightOffset) => {
  const leftAlpha = data[leftOffset + 3] / 255;
  const rightAlpha = data[rightOffset + 3] / 255;
  const alphaWeight = leftAlpha + rightAlpha;
  if (alphaWeight === 0) return [0, 0, 0, 0];
  return [
    ((data[leftOffset] * leftAlpha) + (data[rightOffset] * rightAlpha)) / alphaWeight,
    ((data[leftOffset + 1] * leftAlpha) + (data[rightOffset + 1] * rightAlpha)) / alphaWeight,
    ((data[leftOffset + 2] * leftAlpha) + (data[rightOffset + 2] * rightAlpha)) / alphaWeight,
    ((leftAlpha + rightAlpha) / 2) * 255,
  ];
};

const buildAnimatedGif = (sheet, fileName, background) => {
  const frames = [];
  for (let frame = 0; frame < SOURCE_FRAME_COUNT * 2; frame += 1) {
    const rgba = new Uint8Array(SOURCE_FRAME_SIZE * SOURCE_FRAME_SIZE * 4);
    for (let y = 0; y < SOURCE_FRAME_SIZE; y += 1) {
      for (let x = 0; x < SOURCE_FRAME_SIZE; x += 1) {
        const sourceOffset = generatedPixelOffset(frame, x, y, sheet.width);
        const targetOffset = ((y * SOURCE_FRAME_SIZE) + x) * 4;
        const alpha = sheet.data[sourceOffset + 3] / 255;
        rgba[targetOffset] = Math.round(
          (sheet.data[sourceOffset] * alpha) + (background[0] * (1 - alpha)),
        );
        rgba[targetOffset + 1] = Math.round(
          (sheet.data[sourceOffset + 1] * alpha) + (background[1] * (1 - alpha)),
        );
        rgba[targetOffset + 2] = Math.round(
          (sheet.data[sourceOffset + 2] * alpha) + (background[2] * (1 - alpha)),
        );
        rgba[targetOffset + 3] = 255;
      }
    }
    frames.push(rgba);
  }
  const combinedFrames = new Uint8Array(
    frames.reduce((total, frame) => total + frame.length, 0),
  );
  let offset = 0;
  for (const frame of frames) {
    combinedFrames.set(frame, offset);
    offset += frame.length;
  }
  const palette = quantize(combinedFrames, 256);
  const gif = GIFEncoder();
  frames.forEach((frame, index) => {
    gif.writeFrame(
      applyPalette(frame, palette),
      SOURCE_FRAME_SIZE,
      SOURCE_FRAME_SIZE,
      {
        // GIF stores centiseconds. This repeating 20/20/10 ms cadence gives
        // the 72 interpolated frames the canonical 1.2-second loop exactly.
        delay: index % 3 === 2 ? 10 : 20,
        palette,
        repeat: 0,
      },
    );
  });
  gif.finish();
  fs.writeFileSync(path.join(assetsDirectory, fileName), gif.bytes());
};

const buildInterpolatedSheet = (fileName, gifFileName, background) => {
  const filePath = path.join(assetsDirectory, fileName);
  const source = PNG.sync.read(fs.readFileSync(filePath));
  const isSourceStrip = source.width === SOURCE_FRAME_COUNT * SOURCE_FRAME_SIZE
    && source.height === SOURCE_FRAME_SIZE;
  const isGeneratedSheet = (
    (source.width / SOURCE_FRAME_SIZE) * (source.height / SOURCE_FRAME_SIZE)
    === SOURCE_FRAME_COUNT * 2
  );
  if (!isSourceStrip && !isGeneratedSheet) {
    throw new Error(`Unexpected spinner sheet geometry for ${fileName}: ${source.width}x${source.height}`);
  }

  const output = new PNG({
    width: OUTPUT_COLUMNS * SOURCE_FRAME_SIZE,
    height: OUTPUT_ROWS * SOURCE_FRAME_SIZE,
  });
  for (let sourceFrame = 0; sourceFrame < SOURCE_FRAME_COUNT; sourceFrame += 1) {
    const nextSourceFrame = (sourceFrame + 1) % SOURCE_FRAME_COUNT;
    const originalOutputFrame = sourceFrame * 2;
    const blendedOutputFrame = originalOutputFrame + 1;
    for (let y = 0; y < SOURCE_FRAME_SIZE; y += 1) {
      for (let x = 0; x < SOURCE_FRAME_SIZE; x += 1) {
        const currentOffset = sourcePixelOffset(source, sourceFrame, x, y);
        const nextOffset = sourcePixelOffset(source, nextSourceFrame, x, y);
        const originalOffset = outputPixelOffset(originalOutputFrame, x, y, output.width);
        const blendedOffset = outputPixelOffset(blendedOutputFrame, x, y, output.width);
        writePixel(
          output.data,
          originalOffset,
          source.data[currentOffset],
          source.data[currentOffset + 1],
          source.data[currentOffset + 2],
          source.data[currentOffset + 3],
        );
        writePixel(
          output.data,
          blendedOffset,
          ...blendPixel(source.data, currentOffset, nextOffset),
        );
      }
    }
  }
  fs.writeFileSync(filePath, PNG.sync.write(output));
  buildAnimatedGif(output, gifFileName, background);
};

buildInterpolatedSheet(
  'loading-spinner-dark-strip.png',
  'loading-spinner-dark.gif',
  [0x10, 0x1a, 0x19],
);
buildInterpolatedSheet(
  'loading-spinner-light-strip.png',
  'loading-spinner-light.gif',
  [0xf8, 0xff, 0xf9],
);
