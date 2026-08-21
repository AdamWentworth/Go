import { expect, test } from '@playwright/test';

import { installE2eRoutes } from './support/e2eRoutes';

const routes = [
  '/login',
  '/register',
  '/reset-password?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '/terms',
  '/privacy',
  '/data-deletion',
];

for (const route of routes) {
  test(`${route} fits the viewport without horizontal overflow`, async ({ page }) => {
    await installE2eRoutes(page);
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();

    const widths = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(widths.documentWidth).toBeLessThanOrEqual(widths.viewportWidth);
  });
}

test('desktop registration method selection uses a compact balanced card', async ({ page }) => {
  await installE2eRoutes(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/register');

  const card = page.locator('.register-form--method');
  const methodNote = page.locator('.register-method-note');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByText('Already have an account?')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choose a sign-up method' })).toBeVisible();

  const [cardBounds, noteBounds] = await Promise.all([
    card.boundingBox(),
    methodNote.boundingBox(),
  ]);
  expect(cardBounds).not.toBeNull();
  expect(noteBounds).not.toBeNull();
  expect(cardBounds!.height).toBeLessThan(520);
  expect(cardBounds!.y + cardBounds!.height - (noteBounds!.y + noteBounds!.height)).toBeLessThan(60);

  const google = await page.getByRole('button', { name: 'Sign up with Google' }).boundingBox();
  const discord = await page.getByRole('button', { name: 'Sign up with Discord' }).boundingBox();
  const facebook = await page.getByRole('button', { name: 'Sign up with Facebook' }).boundingBox();
  const email = await page.getByRole('button', { name: 'Continue with email' }).boundingBox();
  expect(google).not.toBeNull();
  expect(discord).not.toBeNull();
  expect(facebook).not.toBeNull();
  expect(email).not.toBeNull();
  expect(Math.abs(google!.y - discord!.y)).toBeLessThan(2);
  expect(Math.abs(facebook!.y - email!.y)).toBeLessThan(2);
});

test('registration controls remain legible in light mode', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('isLightMode', 'true'));
  await installE2eRoutes(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/register');

  const methodStyles = await page.getByRole('button', { name: 'Continue with email' }).evaluate(
    (element) => {
      const styles = window.getComputedStyle(element);
      return { background: styles.backgroundColor, color: styles.color };
    },
  );
  expect(methodStyles.background).not.toBe('rgb(34, 34, 34)');
  expect(methodStyles.color).toBe('rgb(72, 97, 94)');

  await page.getByRole('button', { name: 'Continue with email' }).click();
  const accountStepStyles = await page.getByRole('heading', { name: 'Your account', exact: true }).evaluate(
    (element) => {
      const heading = element.closest('.register-step-heading');
      const input = document.querySelector<HTMLInputElement>('#register-username');
      return {
        headingBackground: heading ? window.getComputedStyle(heading).backgroundColor : '',
        inputBackground: input ? window.getComputedStyle(input).backgroundColor : '',
        inputColor: input ? window.getComputedStyle(input).color : '',
      };
    },
  );
  expect(accountStepStyles.headingBackground).not.toBe('rgb(34, 34, 34)');
  expect(accountStepStyles.inputBackground).not.toBe('rgb(34, 34, 34)');
  expect(accountStepStyles.inputColor).toBe('rgb(72, 97, 94)');
});

test('mobile Terms content and footer remain readable inside the viewport', async ({ page }) => {
  await installE2eRoutes(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/terms');

  const document = page.locator('.legal-document');
  await expect(document.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  await expect(document.getByRole('link', { name: 'Return to Pokémon Go Nexus' })).toBeVisible();
  await expect(document.locator('a[href^="mailto:"]')).toHaveCount(0);

  const bounds = await document.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
});
