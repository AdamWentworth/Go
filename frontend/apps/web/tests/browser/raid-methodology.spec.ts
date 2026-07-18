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

  test("keeps mobile rankings on screen and clearly exposes every metric", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installE2eRoutes(page);
    await page.goto("/raid", { waitUntil: "domcontentloaded" });

    const rankings = page.getByLabel("Top raid attackers");
    const firstDetails = rankings
      .locator(".raid-ranking-mobile-details-toggle")
      .first();

    await expect(firstDetails).toBeVisible();
    await expect(firstDetails).toHaveAccessibleName(
      /Show all raid stats for/i,
    );
    await expect(firstDetails).toContainText("Tap for all stats");
    await expect
      .poll(() =>
        rankings.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true);

    await firstDetails.click();

    await expect(firstDetails).toHaveAttribute("aria-expanded", "true");
    await expect(firstDetails).toHaveAccessibleName(
      /Hide all raid stats for/i,
    );
    await expect(firstDetails).toContainText("Hide extra stats");
    const expandedRow = firstDetails.locator("xpath=ancestor::tr");
    for (const label of ["eDPS", "DPS", "TDO", "ER", "CP"]) {
      await expect(expandedRow.locator(`td[data-label="${label}"]`)).toBeVisible();
    }
  });

  test("keeps Raid dropdown controls and options legible in both themes", async ({
    page,
  }) => {
    await installE2eRoutes(page);
    await page.goto("/raid", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Settings" }).click();

    const friendship = page.getByLabel("Friendship");
    const selectedOption = friendship.locator("option").first();
    const unselectedOption = friendship.locator("option").nth(1);

    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await expect(friendship).toHaveCSS("color-scheme", "dark");
    await expect(friendship).toHaveCSS("background-color", "rgb(19, 33, 36)");
    await expect(selectedOption).toHaveCSS("color", "rgb(6, 24, 25)");
    await expect(selectedOption).toHaveCSS(
      "background-color",
      "rgb(67, 217, 189)",
    );
    await expect(unselectedOption).toHaveCSS("color", "rgb(239, 255, 255)");

    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    await expect(friendship).toHaveCSS("color-scheme", "light");
    await expect(friendship).toHaveCSS("background-color", "rgb(244, 251, 252)");
    await expect(selectedOption).toHaveCSS("color", "rgb(6, 24, 25)");
    await expect(unselectedOption).toHaveCSS("color", "rgb(18, 52, 58)");
  });
});
