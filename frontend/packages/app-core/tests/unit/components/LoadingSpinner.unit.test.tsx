import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoadingSpinner from '@/components/LoadingSpinner';

const sharedMediaPath = (fileName: string) =>
  path.resolve(process.cwd(), '../../../assets/media', fileName);
const duplicatePublicAssetPath = (fileName: string) =>
  path.resolve(process.cwd(), 'public/assets', fileName);
const loadingSpinnerCssPath = path.resolve(
  process.cwd(),
  'src/components/LoadingSpinner.css',
);

describe('LoadingSpinner', () => {
  it('renders separate native-looping dark and light WebM video assets', () => {
    const { container, getByRole, queryByText } = render(<LoadingSpinner />);

    const videos = container.querySelectorAll<HTMLVideoElement>('.spinner-video');

    expect(getByRole('status')).toHaveAccessibleName('Loading');
    expect(queryByText(/^Loading/)).toBeNull();
    expect(videos).toHaveLength(2);
    expect(videos[0]).toHaveClass('spinner-video--dark');
    expect(videos[1]).toHaveClass('spinner-video--light');
    expect(videos[0].hasAttribute('loop')).toBe(true);
    expect(videos[1].hasAttribute('loop')).toBe(true);
    expect(videos[0].muted).toBe(true);
    expect(videos[1].muted).toBe(true);
  });

  it('uses canonical shared-media WebM sources instead of duplicated frontend assets', () => {
    const { container } = render(<LoadingSpinner />);

    const sources = Array.from(
      container.querySelectorAll<HTMLSourceElement>('.spinner-video source'),
    );

    expect(sources.map((source) => source.getAttribute('src'))).toEqual([
      '/media/media/loading_spinner.webm',
      '/media/media/loading_spinner_light.webm',
    ]);
    expect(sources.map((source) => source.getAttribute('type'))).toEqual([
      'video/webm',
      'video/webm',
    ]);
    expect(container.querySelector('.spinner-video.active')).toBeNull();
  });

  it('keeps every spinner media source present in shared assets', () => {
    for (const fileName of [
      'loading_spinner.webm',
      'loading_spinner_light.webm',
    ]) {
      expect(existsSync(sharedMediaPath(fileName)), fileName).toBe(true);
    }
  });

  it('does not keep duplicate spinner media in frontend public assets', () => {
    for (const fileName of [
      'loading_spinner.webm',
      'loading_spinner_light.webm',
    ]) {
      expect(existsSync(duplicatePublicAssetPath(fileName)), fileName).toBe(false);
    }
  });

  it('keeps the spinner visual layers transparent so the video frame does not show a square', () => {
    const css = readFileSync(loadingSpinnerCssPath, 'utf8');

    expect(css).toMatch(
      /\.spinner-visual-shell\s*{[^}]*\bbackground:\s*transparent;[^}]*}/s,
    );
    expect(css).toMatch(
      /\.spinner-video\s*{[^}]*\bbackground:\s*transparent;[^}]*}/s,
    );
    expect(css).not.toMatch(
      /\.(?:spinner-visual-shell|spinner-video)\s*{[^}]*\b(?:box-shadow|filter):/s,
    );
  });
});
