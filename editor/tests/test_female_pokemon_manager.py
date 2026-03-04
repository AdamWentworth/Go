import unittest

from test_base import TempDBTestCase
from database.female_pokemon_manager import FemalePokemonManager


class FemalePokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = FemalePokemonManager(self.db_connection)

    def test_fetch_female_pokemon_returns_rows(self):
        rows = self.manager.fetch_female_pokemon()
        self.assertGreater(len(rows), 0)
        self.assertEqual(len(rows[0]), 5)

    def test_fetch_female_pokemon_image_data_for_missing_id_returns_nones(self):
        data = self.manager.fetch_female_pokemon_image_data(999999)
        self.assertEqual(
            data,
            {
                "image_url": None,
                "shiny_image_url": None,
                "shadow_image_url": None,
                "shiny_shadow_image_url": None,
            },
        )

    def test_update_female_pokemon_images_updates_only_provided_fields(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM female_pokemon LIMIT 1")
        self.assertIsNotNone(pokemon_id)

        original = self.manager.fetch_female_pokemon_image_data(pokemon_id)
        patch = {"image_url": "/images/female/unit_test_default.png"}
        self.manager.update_female_pokemon_images(pokemon_id, patch)

        updated = self.manager.fetch_female_pokemon_image_data(pokemon_id)
        self.assertEqual(updated["image_url"], "/images/female/unit_test_default.png")
        self.assertEqual(updated["shiny_image_url"], original["shiny_image_url"])
        self.assertEqual(updated["shadow_image_url"], original["shadow_image_url"])
        self.assertEqual(updated["shiny_shadow_image_url"], original["shiny_shadow_image_url"])

    def test_update_female_pokemon_images_can_update_all_fields(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM female_pokemon LIMIT 1")
        payload = {
            "image_url": "/images/female/a.png",
            "shiny_image_url": "/images/female/b.png",
            "shadow_image_url": "/images/female/c.png",
            "shiny_shadow_image_url": "/images/female/d.png",
        }
        self.manager.update_female_pokemon_images(pokemon_id, payload)
        updated = self.manager.fetch_female_pokemon_image_data(pokemon_id)
        self.assertEqual(updated, payload)


if __name__ == "__main__":
    unittest.main()
