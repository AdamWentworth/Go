import { expect, test, type Page } from "@playwright/test";

import { installE2eRoutes } from "./support/e2eRoutes";

const RAID_ROUTE_READY_MEASURE = "pokegonexus:raid-route-ready";
const RAID_COLD_ROUTE_READY_BUDGET_MS = 8000;
const RAID_WARM_ROUTE_READY_BUDGET_MS = 3000;

const raidUser = {
  user_id: "raid-user",
  username: "RaidTrainer",
  email: "raid@pokegonexus.local",
  accessTokenExpiry: "2099-01-01T00:00:00.000Z",
  refreshTokenExpiry: "2099-01-02T00:00:00.000Z",
};

const caughtBulbasaur = {
  instance_id: "raid-bulbasaur",
  variant_id: "0001-default",
  pokemon_id: 1,
  nickname: "Sprout",
  is_caught: true,
  disabled: false,
  registered: true,
  cp: 500,
  level: 20,
  attack_iv: 12,
  defense_iv: 13,
  stamina_iv: 14,
  fast_move_id: 22,
  charged_move1_id: 133,
  charged_move2_id: null,
};

async function seedRaidRoster(page: Page, caught = caughtBulbasaur) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ user, caught }) =>
      new Promise<void>((resolve, reject) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("ownershipTimestamp", String(Date.now()));

        const request = indexedDB.open("instancesDB", 2);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains("instances")) {
            database.createObjectStore("instances", {
              keyPath: "instance_id",
            });
          }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("instances", "readwrite");
          const store = transaction.objectStore("instances");
          store.clear();
          store.put(caught);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      }),
    { user: raidUser, caught },
  );
}

test.describe("raid counter worker", () => {
  test("@performance renders rankings within cold and warm budgets without blocking on raid metadata", async ({
    page,
  }) => {
    await installE2eRoutes(page, { raidDataDelayMs: 10_000 });

    await page.goto("/raid", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Top raid attackers" }),
    ).toBeVisible({ timeout: RAID_COLD_ROUTE_READY_BUDGET_MS });
    const coldDuration = await page.waitForFunction(
      (measureName) =>
        performance.getEntriesByName(measureName, "measure").at(-1)?.duration,
      RAID_ROUTE_READY_MEASURE,
    );
    expect(await coldDuration.jsonValue()).toBeLessThan(
      RAID_COLD_ROUTE_READY_BUDGET_MS,
    );

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.goto("/raid", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Top raid attackers" }),
    ).toBeVisible({ timeout: RAID_COLD_ROUTE_READY_BUDGET_MS });
    const warmDuration = await page.waitForFunction(
      (measureName) =>
        performance.getEntriesByName(measureName, "measure").at(-1)?.duration,
      RAID_ROUTE_READY_MEASURE,
    );
    expect(await warmDuration.jsonValue()).toBeLessThan(
      RAID_WARM_ROUTE_READY_BUDGET_MS,
    );
  });

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
    const counterList = page.getByLabel("Raid counters");
    await expect(counterList.locator("article").first()).toBeVisible();

    const megaCharizardX = counterList
      .locator("article")
      .filter({ hasText: "Mega Charizard X" });
    const megaCharizardY = counterList
      .locator("article")
      .filter({ hasText: "Mega Charizard Y" });
    await expect(megaCharizardX).toBeVisible();
    await expect(megaCharizardY).toBeVisible();

    const visibleNames = await counterList
      .locator(".raid-counter-main strong")
      .allTextContents();
    expect(visibleNames.indexOf("Mega Charizard Y")).toBeLessThan(
      visibleNames.indexOf("Mega Charizard X"),
    );

    const displayedDps = async (card: typeof megaCharizardX) =>
      Number.parseFloat(
        (await card
          .locator(".raid-counter-stat")
          .filter({ hasText: "DPS" })
          .locator("dd")
          .textContent()) ?? "0",
      );
    expect(await displayedDps(megaCharizardY)).toBeGreaterThan(
      await displayedDps(megaCharizardX),
    );
    const visibleDps = await counterList
      .locator(".raid-counter-stat:first-child dd")
      .allTextContents();
    const dpsValues = visibleDps.map((value) => Number.parseFloat(value));
    expect(dpsValues).toEqual([...dpsValues].sort((a, b) => b - a));
    await expect(counterList.getByLabel("Rank 1, gold podium")).toBeVisible();
    await expect(counterList.getByLabel("Rank 2, silver podium")).toBeVisible();
    await expect(counterList.getByLabel("Rank 3, bronze podium")).toBeVisible();

    const calibration = page.getByLabel("Observed raid calibration");
    await page.getByText("Raid setup", { exact: true }).click();
    await expect(calibration).toContainText("No raids logged on this device");
    await calibration.getByRole("button", { name: "Log raid" }).click();
    const dialog = page.getByRole("dialog", { name: /Log .* raid/i });
    await dialog.getByLabel("Battle time (seconds)").fill("145.5");
    await dialog.getByLabel("Dodges attempted").fill("4");
    await dialog.getByLabel("Dodges successful").fill("3");
    await dialog.getByLabel(/Measured latency/i).fill("90");
    await dialog.getByRole("button", { name: "Save result" }).click();
    await expect(dialog).toBeHidden();
    expect(
      await page.evaluate(() => {
        const observations = JSON.parse(
          localStorage.getItem("raidCalibrationObservations") ?? "[]",
        );
        return {
          count: observations.length,
          source: observations[0]?.predictionSource,
          outcome: observations[0]?.actual?.outcome,
        };
      }),
    ).toEqual({ count: 1, source: "group-estimate", outcome: "cleared" });
  });

  test("builds a responsive custom party and simulates it off the main thread", async ({
    page,
  }) => {
    await installE2eRoutes(page);
    await page.goto("/raid", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Boss counters" }).click();
    await expect(page.getByText("Modeling raid timelines…")).toBeHidden({
      timeout: 30_000,
    });
    await page.getByText("Raid setup", { exact: true }).click();
    await page.getByText("Battle settings", { exact: true }).click();
    await page.getByLabel("Party Power").selectOption("party4");
    const partyPowerTiming = page.getByLabel("Party Power timing");
    await expect(partyPowerTiming).toBeVisible();
    await partyPowerTiming.selectOption("strongest-charged");
    await expect(partyPowerTiming).toHaveValue("strongest-charged");

    const party = page.getByLabel("Custom raid party");
    await party.getByRole("button", { name: /Custom raid party/i }).click();
    await expect(party.getByLabel("Trainer 1 team slot 1")).not.toHaveValue("");
    await party.getByRole("button", { name: "Add Trainer" }).click();
    await expect(party.getByText("3 Trainers")).toBeVisible();

    const partyWorkerStarted = page.waitForEvent("worker", {
      predicate: (worker) => worker.url().includes("raidParty.worker"),
    });
    await party.getByRole("button", { name: "Simulate", exact: true }).click();
    const partyWorker = await partyWorkerStarted;

    expect(partyWorker.url()).toContain("raidParty.worker");
    await expect(party.getByLabel("Raid party result")).toBeVisible({
      timeout: 30_000,
    });
    await expect(party.getByLabel("Raid party result")).toContainText("DPS");

    const optimizerWorkerStarted = page.waitForEvent("worker", {
      predicate: (worker) => worker.url().includes("raidParty.worker"),
    });
    await party.getByRole("button", { name: "Optimize lobby" }).click();
    await optimizerWorkerStarted;
    await expect(party.getByText("Lobby optimized")).toBeVisible({
      timeout: 60_000,
    });
    await expect(party.getByText(/coordinated lineups checked/)).toBeVisible();
    await expect(party.getByText(/-wide search/)).toBeVisible();
  });

  test("ranks a logged-in Trainer's caught Pokemon at its real level", async ({
    page,
  }) => {
    await installE2eRoutes(page, {
      userInstances: {
        username: raidUser.username,
        instances: { [caughtBulbasaur.instance_id]: caughtBulbasaur },
      },
    });
    await seedRaidRoster(page);

    await page.goto("/raid", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Your top raid attackers" }),
    ).toBeVisible();
    const leaderboard = page.getByLabel("Your top raid attackers");
    await expect(leaderboard.getByText("Bulbasaur")).toBeVisible();
    await expect(leaderboard.getByText(/Sprout · Level 20/)).toBeVisible();
    await expect(page.getByLabel(/attacker level/i)).toHaveCount(0);

    const typeFilter = page.getByLabel("Attacker type filter");
    expect(
      await typeFilter.locator(".raid-ranking-type-options").evaluate(
        (options) => options.scrollWidth <= options.clientWidth + 1,
      ),
    ).toBe(true);
    const electricButton = typeFilter.getByRole("button", {
      name: "Electric",
    });
    await electricButton.click();
    await expect(
      page.getByRole("heading", { name: "Your top Electric raid attackers" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "All Pokémon" }).click();
    await expect(
      page.getByRole("heading", { name: "Top Electric raid attackers" }),
    ).toBeVisible();
    await expect(electricButton).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "My Pokémon" }).click();
    await expect(
      page.getByRole("heading", { name: "Your top Electric raid attackers" }),
    ).toBeVisible();

    await typeFilter.getByRole("button", { name: "All types" }).click();
    await expect(
      page.getByRole("heading", { name: "Your top raid attackers" }),
    ).toBeVisible();
  });

  test("lists an unlocked Mega alongside its caught base form", async ({
    page,
  }) => {
    const caughtRayquaza = {
      ...caughtBulbasaur,
      instance_id: "raid-rayquaza",
      variant_id: "0384-default",
      pokemon_id: 384,
      nickname: "Emerald",
      cp: 3835,
      level: 40,
      attack_iv: 15,
      defense_iv: 15,
      stamina_iv: 15,
      fast_move_id: 47,
      charged_move1_id: 275,
      mega: true,
      is_mega: false,
    };
    await installE2eRoutes(page, {
      userInstances: {
        username: raidUser.username,
        instances: { [caughtRayquaza.instance_id]: caughtRayquaza },
      },
    });
    await seedRaidRoster(page, caughtRayquaza);

    await page.goto("/raid", { waitUntil: "domcontentloaded" });

    await expect(
      page
        .getByRole("button", { name: "My Pokémon" })
        .locator(".raid-roster-count"),
    ).toHaveText("2");
    const leaderboard = page.getByLabel("Your top raid attackers");
    await expect(
      leaderboard.getByText("Rayquaza", { exact: true }),
    ).toBeVisible();
    await expect(
      leaderboard.getByText("Mega Rayquaza", { exact: true }),
    ).toBeVisible();
    await expect(leaderboard.getByText(/Emerald · Level 40/)).toHaveCount(2);
  });
});
