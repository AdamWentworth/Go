import { expect, test } from "@playwright/test";

import { installE2eRoutes } from "./support/e2eRoutes";

test.describe("raid methodology", () => {
  test("opens from raid rankings and returns without leaving the app", async ({ page }) => {
    await installE2eRoutes(page);
    await page.goto("/raid", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Top raid attackers" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Ranking method" }).click();

    await expect(page).toHaveURL(/\/raid\/methodology$/);
    await expect(
      page.getByRole("heading", { name: "How raid rankings work" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "All types" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Boss counters" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));

    await page.goBack();
    await expect(page).toHaveURL(/\/raid$/);
    await expect(
      page.getByRole("heading", { name: "Top raid attackers" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Ranking method" }).click();
    await expect(page).toHaveURL(/\/raid\/methodology$/);

    await page.getByRole("link", { name: "Raid rankings", exact: true }).click();
    await expect(page).toHaveURL(/\/raid$/);
    await expect(
      page.getByRole("heading", { name: "Top raid attackers" }),
    ).toBeVisible();
  });
});
