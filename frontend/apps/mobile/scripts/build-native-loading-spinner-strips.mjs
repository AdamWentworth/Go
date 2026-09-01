import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const SOURCE_FRAME_COUNT = 36;
const SOURCE_FRAME_SIZE = 84;
const OUTPUT_COLUMNS = 36;
const OUTPUT_ROWS = 2;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetsDirectory = path.resolve(scriptDirectory, '../assets');

const sourcePixelOffset = (png, frame, x, y) => {
  const sourceFrame = png.height === SOURCE_FRAME_SIZE
    ? frame
    : frame * 2;
  const sourceColumn = sourceFrame % OUTPUT_COLUMNS;
  const sourceRow = Math.floor(sourceFrame / OUTPUT_COLUMNS);
  return (((sourceRow * SOURCE_FRAME_SIZE) + y) * png.width
    + (sourceColumn * SOURCE_FRAME_SIZE) + x) * 4;
};

const outputPixelOffset = (frame, x, y, outputWidth) => {
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

const buildInterpolatedSheet = (fileName) => {
  const filePath = path.join(assetsDirectory, fileName);
  const source = PNG.sync.read(fs.readFileSync(filePath));
  const isSourceStrip = source.width === SOURCE_FRAME_COUNT * SOURCE_FRAME_SIZE
    && source.height === SOURCE_FRAME_SIZE;
  const isGeneratedSheet = source.width === OUTPUT_COLUMNS * SOURCE_FRAME_SIZE
    && source.height === OUTPUT_ROWS * SOURCE_FRAME_SIZE;
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
};

buildInterpolatedSheet('loading-spinner-dark-strip.png');
buildInterpolatedSheet('loading-spinner-light-strip.png');
