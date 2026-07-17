import { expect, test } from "@playwright/test";

import { installE2eRoutes } from "./support/e2eRoutes";

test.describe("raid counter worker", () => {
  test("calculates exhaustive boss counters off the main thread", async ({
    page,
  }) => {
    await installE2eRoutes(page);
    const workerStarted = page.waitForEvent("worker");

    await page.goto("/raid", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Boss counters" }).click();

    const worker = await workerStarted;
    expect(worker.url()).toContain("raidCounter.worker");
    await expect(page.getByText("Modeling raid timelines…")).toBeHidden({
      timeout: 30_000,
    });
    await expect(
      page.getByLabel("Raid counters").locator("article").first(),
    ).toBeVisible();
  });
});
