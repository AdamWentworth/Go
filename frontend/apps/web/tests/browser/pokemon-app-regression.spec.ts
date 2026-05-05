import { expect, test } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import {
  countIndexedDbStore,
  disconnectLoadingOverlayProbe,
  dispatchTouchSwipe,
  expectActivePokemonView,
  expectNoLoadingOverlaySeen,
  installLoadingOverlayProbe,
  openCaughtPokemonList,
  openPokemonPage,
} from './support/pokemonApp';

test.describe('pokemon app browser regressions', () => {
  test('switches between Pokemon menus without replaying the boot loading overlay', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);
      await expectActivePokemonView(page, 'Pokémon');
      await installLoadingOverlayProbe(page);

      await page.getByText('TAGS', { exact: true }).click();
      await expectActivePokemonView(page, 'TAGS');
      await expectNoLoadingOverlaySeen(page);

      await page.getByText('POKÉDEX', { exact: true }).click();
      await expectActivePokemonView(page, 'POKÉDEX');
      await expectNoLoadingOverlaySeen(page);

      await page.getByText('Pokémon', { exact: true }).click();
      await expectActivePokemonView(page, 'Pokémon');
      await expectNoLoadingOverlaySeen(page);
    } finally {
      await disconnectLoadingOverlayProbe(page);
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('opens a caught instance overlay with scroll-safe layout', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      const { firstCaughtCard } = await openCaughtPokemonList(page);
      await firstCaughtCard.click();

      const overlay = page.locator('.instance-overlay.caught-mode');
      await expect(overlay).toBeVisible();
      await expect(page.locator('.caught-scroll')).toBeVisible();
      await expect(page.locator('.caught-instance')).toBeVisible();
      await expect(page.locator('.app-loading-overlay')).toHaveCount(0);

      const metrics = await page.evaluate(() => {
        const overlay = document.querySelector('.instance-overlay.caught-mode');
        const scroll = document.querySelector('.caught-scroll');
        const column = document.querySelector('.caught-column');
        const content = document.querySelector('.caught-instance');
        if (!overlay || !scroll || !column || !content) {
          throw new Error('Caught overlay did not render expected elements');
        }

        return {
          viewportHeight: window.innerHeight,
          overlayHeight: overlay.getBoundingClientRect().height,
          scrollMinHeight: window.getComputedStyle(scroll).minHeight,
          scrollHeight: overlay.scrollHeight,
          clientHeight: overlay.clientHeight,
          columnWidth: column.getBoundingClientRect().width,
          contentWidth: content.getBoundingClientRect().width,
        };
      });

      expect(metrics.scrollMinHeight).not.toBe('100dvh');
      expect(metrics.overlayHeight).toBeGreaterThan(metrics.viewportHeight * 0.9);
      expect(metrics.clientHeight).toBeGreaterThan(0);
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);
      expect(metrics.columnWidth).toBeGreaterThanOrEqual(metrics.contentWidth);

      await page.getByRole('button', { name: 'Close' }).click();
      await expect(overlay).toHaveCount(0);
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('persists Pokemon boot data into IndexedDB', async ({ page }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);

      await expect
        .poll(() => countIndexedDbStore(page, 'variantsDB', 'variants'))
        .toBeGreaterThan(0);
      await expect
        .poll(() => countIndexedDbStore(page, 'instancesDB', 'instances'))
        .toBeGreaterThan(0);
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('changes Pokemon views with horizontal touch swipes on mobile', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(!isMobile, 'touch swipe coverage only runs on mobile browser projects');

    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);
      await expectActivePokemonView(page, 'Pokémon');
      await installLoadingOverlayProbe(page);

      const slider = page.locator('.view-slider-container');
      const box = await slider.boundingBox();
      expect(box, 'view slider should be measurable').not.toBeNull();
      if (!box) return;

      const y = Math.round(box.y + box.height * 0.45);
      await dispatchTouchSwipe(
        slider,
        { clientX: Math.round(box.x + box.width * 0.82), clientY: y },
        { clientX: Math.round(box.x + box.width * 0.18), clientY: y },
      );
      await expectActivePokemonView(page, 'TAGS');
      await expectNoLoadingOverlaySeen(page);

      await dispatchTouchSwipe(
        slider,
        { clientX: Math.round(box.x + box.width * 0.18), clientY: y },
        { clientX: Math.round(box.x + box.width * 0.82), clientY: y },
      );
      await expectActivePokemonView(page, 'Pokémon');
      await expectNoLoadingOverlaySeen(page);
    } finally {
      await disconnectLoadingOverlayProbe(page);
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });
});
