import path from 'node:path';

import { expect, test } from '@playwright/test';

const pokemonGridCssPath = path.resolve(
  process.cwd(),
  '../../packages/app-core/src/pages/Pokemon/components/Menus/PokemonMenu/PokemonGrid.css',
);
const pokemonCardCssPath = path.resolve(
  process.cwd(),
  '../../packages/app-core/src/pages/Pokemon/components/Menus/PokemonMenu/PokemonCard.css',
);

test.describe('pokemon grid layout', () => {
  test('card image slots reserve height before images load', async ({ page }) => {
    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <style>
            html,
            body {
              margin: 0;
            }

            .fixture {
              width: 360px;
              padding: 8px;
            }

            .pokemon-card {
              width: 120px;
            }
          </style>
        </head>
        <body>
          <div class="fixture">
            <div class="pokemon-grid-row">
              <div class="pokemon-grid-cell visible">
                <div class="pokemon-card">
                  <div class="pokemon-image-container">
                    <img class="pokemon-image" alt="Pending pokemon asset" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    await page.addStyleTag({ path: pokemonGridCssPath });
    await page.addStyleTag({ path: pokemonCardCssPath });

    const metrics = await page.evaluate(() => {
      const imageSlot = document.querySelector('.pokemon-image-container');
      const row = document.querySelector('.pokemon-grid-row');
      if (!imageSlot || !row) {
        throw new Error('Grid fixture did not render expected elements');
      }

      const imageSlotRect = imageSlot.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();

      return {
        imageSlotWidth: imageSlotRect.width,
        imageSlotHeight: imageSlotRect.height,
        rowHeight: rowRect.height,
      };
    });

    expect(metrics.imageSlotHeight).toBeGreaterThan(0);
    expect(metrics.imageSlotHeight).toBeCloseTo(metrics.imageSlotWidth, 0);
    expect(metrics.rowHeight).toBeGreaterThanOrEqual(metrics.imageSlotHeight);
  });
});
