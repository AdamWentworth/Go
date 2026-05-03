import { expect, test } from '@playwright/test';

import { installE2eRoutes } from './support/e2eRoutes';

test.describe('browser capability snapshot', () => {
  test('records runtime features that commonly differ in Safari', async ({ page }, testInfo) => {
    await installE2eRoutes(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const capabilities = await page.evaluate(() => ({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      storage: {
        indexedDB: 'indexedDB' in window,
        localStorage: (() => {
          try {
            window.localStorage.setItem('__e2e_storage_probe', '1');
            window.localStorage.removeItem('__e2e_storage_probe');
            return true;
          } catch {
            return false;
          }
        })(),
      },
      apis: {
        eventSource: 'EventSource' in window,
        visualViewport: 'visualViewport' in window,
        serviceWorker: 'serviceWorker' in navigator,
        clipboard: 'clipboard' in navigator,
      },
      css: {
        dynamicViewportUnits: CSS.supports('height: 100dvh'),
        safeAreaInsets: CSS.supports('padding-top: env(safe-area-inset-top)'),
        backdropFilter: CSS.supports('backdrop-filter: blur(1px)'),
        webkitBackdropFilter: CSS.supports('-webkit-backdrop-filter: blur(1px)'),
        hasSelector: CSS.supports('selector(:has(*))'),
      },
    }));

    await testInfo.attach('browser-capabilities.json', {
      body: JSON.stringify(capabilities, null, 2),
      contentType: 'application/json',
    });

    expect(capabilities.storage.indexedDB).toBe(true);
    expect(capabilities.storage.localStorage).toBe(true);
  });
});
