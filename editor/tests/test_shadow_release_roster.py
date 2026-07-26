import sys
import unittest
from datetime import date
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from scripts.apply_shadow_release_roster import (
    CatalogPokemon,
    resolve_release_targets,
)
from utils.shadow_release_catalog import ShadowSourceEntry


def catalog_pokemon(
    pokemon_id: int,
    pokedex_number: int,
    *,
    form: str = "",
) -> CatalogPokemon:
    return CatalogPokemon(
        pokemon_id=pokemon_id,
        pokedex_number=pokedex_number,
        name=f"Pokemon {pokemon_id}",
        form=form,
        shiny_available=True,
        shiny_released_on=date(2020, 1, 1),
    )


class ShadowReleaseRosterTests(unittest.TestCase):
    def test_source_tokens_resolve_catalog_forms_costumes_and_derived_rows(self):
        pokemon = (
            catalog_pokemon(19, 19),
            catalog_pokemon(2011, 19, form="Alolan"),
            catalog_pokemon(2301, 249, form="Apex"),
            catalog_pokemon(521, 521),
            catalog_pokemon(2339, 521, form="Female"),
        )
        by_id = {entry.pokemon_id: entry for entry in pokemon}
        by_dex: dict[int, list[CatalogPokemon]] = {}
        for entry in pokemon:
            by_dex.setdefault(entry.pokedex_number, []).append(entry)

        released_on = date(2026, 3, 3)
        source_entries = [
            ShadowSourceEntry("0019", "Rattata", released_on, True),
            ShadowSourceEntry("0019A", "Alolan Rattata", released_on, True),
            ShadowSourceEntry("0249A", "Apex Shadow Lugia", released_on, False),
            ShadowSourceEntry("0521", "Unfezant", released_on, True),
            ShadowSourceEntry(
                "0020Jan2020",
                "Party Hat Raticate",
                released_on,
                True,
            ),
        ]

        targets = resolve_release_targets(source_entries, by_id, by_dex)

        self.assertEqual(
            {
                (target.kind, target.target_id)
                for target in targets
            },
            {
                ("pokemon", 19),
                ("pokemon", 2011),
                ("pokemon", 2301),
                ("pokemon", 521),
                ("pokemon", 2339),
                ("costume", 42),
            },
        )

    def test_unknown_form_suffix_fails_closed(self):
        pokemon = catalog_pokemon(19, 19)

        with self.assertRaisesRegex(RuntimeError, "unresolved catalog form"):
            resolve_release_targets(
                [
                    ShadowSourceEntry(
                        "0019X",
                        "Unknown Rattata",
                        date(2026, 3, 3),
                        False,
                    )
                ],
                {19: pokemon},
                {19: [pokemon]},
            )


if __name__ == "__main__":
    unittest.main()
