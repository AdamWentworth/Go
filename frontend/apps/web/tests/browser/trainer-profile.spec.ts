import { expect, test, type Page } from "@playwright/test";

import { attachBrowserDiagnostics } from "./support/diagnostics";
import { installE2eRoutes } from "./support/e2eRoutes";

const trainerUser = {
  user_id: "trainer-card-user",
  username: "TrainerCard",
  email: "trainer-card@pokegonexus.local",
  accessTokenExpiry: "2099-01-01T00:00:00.000Z",
  refreshTokenExpiry: "2099-01-02T00:00:00.000Z",
};

const trainerProfile = {
  user: {
    user_id: trainerUser.user_id,
    username: trainerUser.username,
    pokemonGoName: "NexusTrainer",
    team: "Mystic",
    trainer_level: 50,
    total_xp: 88_000_000,
    pogo_started_on: "2016-07-06T00:00:00Z",
    app_joined_at: "2026-01-01T00:00:00Z",
  },
  bio: "Collector, raider, and trade day regular.",
  location: "Vancouver, BC",
  trainer_code: "123456789012",
  stats: {
    caught: 2247,
    for_trade: 83,
    wanted: 17,
    favorites: 155,
    registered: 1024,
  },
  highlights: [
    {
      instance_id: "featured-bulbasaur",
      variant_id: "0001-default",
      pokemon_id: 1,
      nickname: "Buddy",
      cp: 1115,
      is_caught: true,
      disabled: false,
    },
    {
      instance_id: "featured-charmander",
      variant_id: "0004-default",
      pokemon_id: 4,
      nickname: null,
      cp: 980,
      is_caught: true,
      disabled: false,
    },
  ],
  viewer: {
    relationship: "self",
    can_view_profile: true,
    can_view_collection: true,
  },
};

async function seedTrainerLogin(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate((user) => {
    localStorage.setItem("user", JSON.stringify(user));
  }, trainerUser);
}

test.describe("Trainer profile card", () => {
  test("keeps trainer identity, showcase, and collection facts visible without horizontal overflow", async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await installE2eRoutes(page, { trainerProfile });
      await seedTrainerLogin(page);
      await page.goto("/profile", { waitUntil: "domcontentloaded" });

      const card = page.getByRole("region", {
        name: `${trainerUser.username}'s trainer card`,
      });
      await expect(card).toBeVisible();
      await expect(
        card.getByRole("heading", { name: "NexusTrainer" }),
      ).toBeVisible();
      await expect(card.getByText("88,000,000 XP")).toBeVisible();
      await expect(card.getByText("Jul 6, 2016")).toBeVisible();
      await expect(
        card.getByLabel("Featured Pokemon", { exact: true }),
      ).toBeVisible();
      await expect(card.getByLabel("Collection summary")).toBeVisible();
      await expect(
        card.getByLabel("Empty featured Pokemon slot 6"),
      ).toBeVisible();

      const layout = await page.locator(".trainer-page").evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        cardWidth:
          document
            .querySelector(".trainer-profile-card")
            ?.getBoundingClientRect().width ?? 0,
      }));
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.cardWidth).toBeLessThanOrEqual(layout.viewportWidth);

      const screenshotPath = testInfo.outputPath("trainer-profile.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach("trainer profile", {
        path: screenshotPath,
        contentType: "image/png",
      });

      const collectionButton = card.getByRole("button", {
        name: "View Pokemon",
      });
      await collectionButton.scrollIntoViewIfNeeded();
      await expect(collectionButton).toBeVisible();
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });

  test("selects featured Pokemon from a visual six-card picker", async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await installE2eRoutes(page, { trainerProfile });
      await seedTrainerLogin(page);
      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Edit" }).click();

      const picker = page.getByLabel("Choose featured Pokemon");
      await expect(picker).toBeVisible();
      await expect(
        picker.getByLabel("2 of 6 Pokemon selected"),
      ).toBeVisible();

      const screenshotPath = testInfo.outputPath("trainer-showcase-picker.png");
      await picker.screenshot({ path: screenshotPath });
      await testInfo.attach("trainer showcase picker", {
        path: screenshotPath,
        contentType: "image/png",
      });

      const buddy = picker.getByRole("button", {
        name: "Remove Buddy from trainer card",
      });
      await buddy.click();
      await expect(
        picker.getByLabel("1 of 6 Pokemon selected"),
      ).toBeVisible();
      await expect(
        picker.getByRole("button", {
          name: "Select Buddy for trainer card",
        }),
      ).toBeVisible();
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });
});
