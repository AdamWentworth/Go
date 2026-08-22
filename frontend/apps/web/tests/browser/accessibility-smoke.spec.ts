import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

const publicRoutes = [
  '/',
  '/getting-started',
  '/login',
  '/register',
  '/terms',
  '/privacy',
] as const;

const authenticatedRoutes = [
  '/pokemon',
  '/search',
  '/trades',
  '/profile',
  '/profile/friends',
  '/settings',
  '/settings/account',
  '/pokedex',
  '/raid',
  '/max',
  '/pvp',
  '/rankings',
  '/trade-board',
] as const;

const addSignedInUser = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('user', JSON.stringify({
      accessTokenExpiry: '2099-01-01T00:00:00.000Z',
      allowLocation: false,
      email: 'accessibility@example.test',
      location: '',
      pokemonGoName: 'AccessibleTrainerGO',
      refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
      trainerCode: '',
      user_id: 'accessibility-user',
      username: 'AccessibleTrainer',
    }));
  });
};

const scanRoute = async (page: Page, routePath: string) => {
  const response = await page.goto(routePath, { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), `${routePath} document response should be OK`).toBe(true);
  await expect(page.locator('#root')).not.toBeEmpty();
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blockingViolations = results.violations.filter(
    ({ impact }) => impact === 'critical' || impact === 'serious',
  );
  const violationSummary = blockingViolations.map(({ help, id, impact, nodes }) => ({
    help,
    id,
    impact,
    nodes: nodes.map(({ failureSummary, html, target }) => ({
      failureSummary,
      html,
      target,
    })),
  }));

  expect(
    violationSummary,
    `${routePath} should have no serious or critical accessibility violations`,
  ).toEqual([]);
};

test.describe('accessibility route smoke', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !['chromium-desktop', 'mobile-chrome'].includes(testInfo.project.name),
      'One desktop and one mobile browser cover deterministic axe checks.',
    );
    await installE2eRoutes(page);
  });

  for (const routePath of publicRoutes) {
    test(`keeps ${routePath} free of blocking axe violations`, async ({ page }, testInfo) => {
      const diagnostics = attachBrowserDiagnostics(page, testInfo);
      try {
        await scanRoute(page, routePath);
      } finally {
        await diagnostics.flush();
      }
      expect(diagnostics.blockingErrors()).toEqual([]);
    });
  }

  for (const routePath of authenticatedRoutes) {
    test(`keeps ${routePath} free of blocking axe violations`, async ({ page }, testInfo) => {
      const diagnostics = attachBrowserDiagnostics(page, testInfo);
      await addSignedInUser(page);
      if (routePath === '/settings/account') {
        await page.route('**/account/security', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              activeSessions: 1,
              email: 'accessibility@example.test',
              hasPassword: true,
              providers: [],
            }),
          });
        });
      }
      try {
        await scanRoute(page, routePath);
      } finally {
        await diagnostics.flush();
      }
      expect(diagnostics.blockingErrors()).toEqual([]);
    });
  }
});
