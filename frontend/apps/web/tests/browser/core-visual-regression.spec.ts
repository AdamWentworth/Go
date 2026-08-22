import { expect, test, type Page } from "@playwright/test";

import { installE2eRoutes } from "./support/e2eRoutes";

const addSignedInUser = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        accessTokenExpiry: "2099-01-01T00:00:00.000Z",
        allowLocation: false,
        email: "visual@example.test",
        location: "",
        pokemonGoName: "VisualTrainerGO",
        refreshTokenExpiry: "2099-01-02T00:00:00.000Z",
        trainerCode: "",
        user_id: "visual-user",
        username: "VisualTrainer",
      }),
    );
  });
};

const stabilizePage = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.addStyleTag({
    content: [
      "*, *::before, *::after { animation: none !important; transition: none !important; }",
      '[data-testid="perf-telemetry"] { visibility: hidden !important; }',
    ].join("\n"),
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

const expectVisualBaseline = async (page: Page, snapshotName: string) => {
  await stabilizePage(page);
  await expect(page).toHaveScreenshot(snapshotName, {
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    maxDiffPixelRatio: 0.02,
  });
};

const expectScrolledVisualBaseline = async (
  page: Page,
  selector: string,
  snapshotName: string,
) => {
  const element = page.locator(selector);
  await element.evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await expectVisualBaseline(page, snapshotName);
};

test.describe("core responsive visual regression", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      !["chromium-desktop", "mobile-chrome"].includes(testInfo.project.name),
      "Visual baselines are maintained for representative desktop and mobile Chromium.",
    );
  });

  test("matches the signed-out Home baseline", async ({ page }) => {
    await installE2eRoutes(page, { mockImages: false });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        name: "Build your collection. Find the right trade.",
      }),
    ).toBeVisible();
    await expectVisualBaseline(page, "home-signed-out.png");
    await expectScrolledVisualBaseline(
      page,
      "#feature-directory",
      "home-feature-directory.png",
    );
  });

  test("matches the registration method baseline", async ({ page }) => {
    await installE2eRoutes(page, { mockImages: false });
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expectVisualBaseline(page, "register-method.png");
  });

  test("matches the signed-in Search baseline", async ({ page }) => {
    await installE2eRoutes(page);
    await addSignedInUser(page);
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
    await expectVisualBaseline(page, "search-signed-in.png");
  });

  test("matches the Trade Activity baseline", async ({ page }) => {
    await installE2eRoutes(page);
    await addSignedInUser(page);
    await page.goto("/trades", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Trade Activity" }).click();
    await expect(
      page.getByRole("heading", { name: "Your trades" }),
    ).toBeVisible();
    await expectVisualBaseline(page, "trades-activity-empty.png");
  });
});
