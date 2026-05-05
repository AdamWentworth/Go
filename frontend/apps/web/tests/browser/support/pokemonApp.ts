import { expect, type Locator, type Page } from '@playwright/test';

import { installE2eRoutes } from './e2eRoutes';

const cardSelector = '[role="button"][aria-label^="View "][aria-label$=" details"]';

type LoadingProbeWindow = Window & {
  __e2eLoadingOverlaySeen?: boolean;
  __e2eLoadingOverlayObserver?: MutationObserver;
};

type TouchPoint = {
  clientX: number;
  clientY: number;
};

export async function openPokemonPage(page: Page) {
  await installE2eRoutes(page);

  const response = await page.goto('/pokemon', { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), '/pokemon document response should be OK').toBe(true);

  const firstCard = page.locator(cardSelector).first();
  await expect(firstCard).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.pokemon-grid-cell.visible').first()).toBeVisible();
  await expect(page.locator('.app-loading-overlay')).toHaveCount(0);

  return { firstCard };
}

export async function openCaughtPokemonList(page: Page) {
  await openPokemonPage(page);
  await expect
    .poll(() => countIndexedDbStore(page, 'instancesDB', 'instances'))
    .toBeGreaterThan(0);

  const caughtCount = await markFirstInstancesCaught(page, 12);
  expect(caughtCount).toBeGreaterThan(0);

  const response = await page.goto('/pokemon', { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), '/pokemon reload response should be OK').toBe(true);
  await expect(page.locator(cardSelector).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.app-loading-overlay')).toHaveCount(0);

  await page.getByText('TAGS', { exact: true }).click();
  await expectActivePokemonView(page, 'TAGS');
  const caughtTag = page.locator('.tag-item[data-tag="Caught"]');
  await expect(caughtTag.locator('.tag-subtitle')).toContainText(
    /[1-9]\d* Pokémon have this tag\./,
  );
  await caughtTag.click();
  await expectActivePokemonView(page, 'Pokémon');

  const firstCaughtCard = page.locator(cardSelector).first();
  await expect(firstCaughtCard).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.pokemon-grid-cell.visible').first()).toBeVisible();
  await expect(page.locator('.app-loading-overlay')).toHaveCount(0);

  return { firstCaughtCard };
}

export async function expectActivePokemonView(page: Page, label: string | RegExp) {
  await expect(
    page.locator('.toggle-text.active').filter({ hasText: label }).first(),
  ).toBeVisible();
}

export async function installLoadingOverlayProbe(page: Page) {
  await page.evaluate(() => {
    const targetWindow = window as LoadingProbeWindow;
    targetWindow.__e2eLoadingOverlayObserver?.disconnect();
    targetWindow.__e2eLoadingOverlaySeen = Boolean(
      document.querySelector('.app-loading-overlay'),
    );

    targetWindow.__e2eLoadingOverlayObserver = new MutationObserver(() => {
      if (document.querySelector('.app-loading-overlay')) {
        targetWindow.__e2eLoadingOverlaySeen = true;
      }
    });
    targetWindow.__e2eLoadingOverlayObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

export async function expectNoLoadingOverlaySeen(page: Page) {
  await page.waitForTimeout(250);
  await expect(page.locator('.app-loading-overlay')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean((window as LoadingProbeWindow).__e2eLoadingOverlaySeen),
      ),
    )
    .toBe(false);
}

export async function disconnectLoadingOverlayProbe(page: Page) {
  await page.evaluate(() => {
    const targetWindow = window as LoadingProbeWindow;
    targetWindow.__e2eLoadingOverlayObserver?.disconnect();
    delete targetWindow.__e2eLoadingOverlayObserver;
    delete targetWindow.__e2eLoadingOverlaySeen;
  });
}

export async function dispatchTouchSwipe(
  locator: Locator,
  start: TouchPoint,
  end: TouchPoint,
) {
  const middle = {
    clientX: Math.round((start.clientX + end.clientX) / 2),
    clientY: Math.round((start.clientY + end.clientY) / 2),
  };

  await dispatchTouch(locator, 'touchstart', start);
  await dispatchTouch(locator, 'touchmove', middle);
  await dispatchTouch(locator, 'touchmove', end);
  await dispatchTouch(locator, 'touchend', end, true);
}

async function dispatchTouch(
  locator: Locator,
  type: 'touchstart' | 'touchmove' | 'touchend',
  point: TouchPoint,
  end = false,
) {
  const touch = {
    identifier: 1,
    clientX: point.clientX,
    clientY: point.clientY,
    pageX: point.clientX,
    pageY: point.clientY,
    screenX: point.clientX,
    screenY: point.clientY,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  };

  await locator.dispatchEvent(type, {
    touches: end ? [] : [touch],
    targetTouches: end ? [] : [touch],
    changedTouches: [touch],
    bubbles: true,
    cancelable: true,
  });
}

export async function countIndexedDbStore(
  page: Page,
  dbName: string,
  storeName: string,
) {
  return page.evaluate(
    ({ dbName: targetDbName, storeName: targetStoreName }) =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open(targetDbName);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(targetStoreName)) {
            db.close();
            resolve(0);
            return;
          }

          const tx = db.transaction(targetStoreName, 'readonly');
          const countRequest = tx.objectStore(targetStoreName).count();
          countRequest.onerror = () => {
            db.close();
            reject(countRequest.error);
          };
          countRequest.onsuccess = () => {
            const count = countRequest.result;
            db.close();
            resolve(count);
          };
        };
      }),
    { dbName, storeName },
  );
}

async function markFirstInstancesCaught(page: Page, limit: number) {
  return page.evaluate(
    ({ limit: maxInstances }) =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('instancesDB');

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('instances')) {
            db.close();
            resolve(0);
            return;
          }

          const tx = db.transaction('instances', 'readwrite');
          const store = tx.objectStore('instances');
          const getAllRequest = store.getAll();
          let caughtCount = 0;

          getAllRequest.onerror = () => {
            db.close();
            reject(getAllRequest.error);
          };

          getAllRequest.onsuccess = () => {
            const instances = getAllRequest.result
              .filter(
                (entry): entry is Record<string, unknown> =>
                  Boolean(
                    entry &&
                      typeof entry === 'object' &&
                      typeof entry.instance_id === 'string' &&
                      typeof entry.variant_id === 'string',
                  ),
              )
              .slice(0, maxInstances);
            caughtCount = instances.length;

            for (const instance of instances) {
              store.put({
                ...instance,
                is_caught: true,
                registered: true,
                status: 'caught',
              });
            }
          };

          tx.oncomplete = () => {
            db.close();
            window.localStorage.setItem('ownershipTimestamp', String(Date.now()));
            window.localStorage.removeItem('tagsTimestamp');
            resolve(caughtCount);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    { limit },
  );
}
