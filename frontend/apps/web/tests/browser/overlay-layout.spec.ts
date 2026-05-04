import path from 'node:path';

import { expect, test } from '@playwright/test';

const instanceOverlayCssPath = path.resolve(
  process.cwd(),
  '../../packages/app-core/src/pages/Pokemon/features/instances/InstanceOverlay.css',
);

test.describe('instance overlay layout', () => {
  test('caught panel background follows short content instead of stretching to viewport height', async ({
    page,
  }) => {
    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <style>
            html,
            body {
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="instance-overlay caught-mode">
            <div class="caught-fullscreen">
              <div class="caught-scroll">
                <div class="instance-motion-shell instance-motion-shell--caught">
                  <div class="caught-column">
                    <div class="caught-instance">
                      <div class="instance-details-body" style="height: 180px;">
                        Short caught overlay content
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    await page.addStyleTag({ path: instanceOverlayCssPath });

    const metrics = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const scroll = document.querySelector('.caught-scroll');
      const column = document.querySelector('.caught-column');
      const content = document.querySelector('.instance-details-body');
      if (!scroll || !column || !content) {
        throw new Error('Overlay fixture did not render expected elements');
      }

      return {
        viewportHeight,
        scrollMinHeight: window.getComputedStyle(scroll).minHeight,
        columnHeight: column.getBoundingClientRect().height,
        contentHeight: content.getBoundingClientRect().height,
      };
    });

    expect(metrics.scrollMinHeight).not.toBe('100dvh');
    expect(metrics.columnHeight).toBeGreaterThanOrEqual(metrics.contentHeight);
    expect(metrics.columnHeight).toBeLessThan(metrics.viewportHeight * 0.75);
  });
});
