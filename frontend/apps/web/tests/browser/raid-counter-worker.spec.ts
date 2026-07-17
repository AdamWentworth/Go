import { expect, test, type Page } from "@playwright/test";

import { installE2eRoutes } from "./support/e2eRoutes";

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
      page.getByText("2 raid-ready entries from 1 caught"),
    ).toBeVisible();
    const leaderboard = page.getByLabel("Your top raid attackers");
    await expect(leaderboard.getByText("Rayquaza", { exact: true })).toBeVisible();
    await expect(leaderboard.getByText("Mega Rayquaza", { exact: true })).toBeVisible();
    await expect(leaderboard.getByText(/Emerald · Level 40/)).toHaveCount(2);
  });
});
