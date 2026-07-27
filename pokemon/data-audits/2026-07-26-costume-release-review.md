# Costume release review

Reviewed on 2026-07-26.

## Source

- Event Pokémon roster:
  <https://bulbapedia.bulbagarden.net/wiki/Event_Pok%C3%A9mon_%28GO%29>
- Reviewed page revision: `4595680`

The twelve reviewed releases after Pokémon Day 2026 were published to the
production catalog on 2026-07-26. Their catalog image URLs are intentionally
present before the image files so the editor can add artwork without another
metadata migration.

## Artwork queue

| Costume ID | Release | Pokémon | Costume | Normal asset | Shiny asset |
| --- | --- | --- | --- | --- | --- |
| `321` | 2026-03-10 | Ditto | Pokopia Hat | `pokemon_132_pokopia_hat_default.png` | `pokemon_132_pokopia_hat_shiny.png` |
| `322` | 2026-03-10 | Ditto | Pokopia Cap | `pokemon_132_pokopia_cap_default.png` | `pokemon_132_pokopia_cap_shiny.png` |
| `323` | 2026-04-03 | Pikachu | Baseball Shirt | `pokemon_25_baseball_shirt_default.png` | `pokemon_25_baseball_shirt_shiny.png` |
| `324` | 2026-04-14 | Galarian Corsola | Pink Sunglasses | `pokemon_2041_pink_sunglasses_default.png` | `pokemon_2041_pink_sunglasses_shiny.png` |
| `325` | 2026-05-12 | Pikachu | Marathon Visor | `pokemon_25_marathon_visor_default.png` | `pokemon_25_marathon_visor_shiny.png` |
| `326` | 2026-05-22 | Pikachu | Excavator | `pokemon_25_excavator_default.png` | `pokemon_25_excavator_shiny.png` |
| `327` | 2026-05-24 | Caterpie | Poké Ball Hat | `pokemon_10_poke_ball_hat_default.png` | `pokemon_10_poke_ball_hat_shiny.png` |
| `328` | 2026-05-24 | Pikachu | Team Mystic Hat | `pokemon_25_team_mystic_hat_default.png` | `pokemon_25_team_mystic_hat_shiny.png` |
| `329` | 2026-06-04 | Pikachu | Team Instinct Hat | `pokemon_25_team_instinct_hat_default.png` | `pokemon_25_team_instinct_hat_shiny.png` |
| `330` | 2026-06-11 | Pikachu | Team Valor Hat | `pokemon_25_team_valor_hat_default.png` | `pokemon_25_team_valor_hat_shiny.png` |
| `331` | 2026-07-04 | Gimmighoul | 10th Anniversary Coin | `pokemon_999_10th_anniversary_coin_default.png` | `pokemon_999_10th_anniversary_coin_shiny.png` |
| `332` | 2026-07-21 | Pikachu | Professor Willow's Assistant | `pokemon_25_professor_willows_assistant_default.png` | `pokemon_25_professor_willows_assistant_shiny.png` |

Normal assets belong in `assets/images/costumes/`. Shiny assets belong in
`assets/images/costumes_shiny/`. The reviewed source marks all twelve costumes
as Shiny-eligible.

Female-specific Pikachu assets belong in `assets/images/female/costumes/` and
`assets/images/female/costumes_shiny/`. The catalog records for costume IDs
`323`, `325`, `326`, `328`, `329`, `330`, and `332` include these stable image
targets:

- `female_pokemon_25_<costume>_default.png`
- `female_pokemon_25_<costume>_shiny.png`

The authoring script derives this behavior from the species `female_unique`
flag, so future costumes for any species with distinct female artwork receive
the same complete set of image URLs automatically.

## Background links

- Background `239` (Pokopia) links Ditto to costume IDs `321` and `322`.
- Backgrounds `202` through `210` (NPB 2026) link Pikachu to costume ID `323`.
- Background `231` (Taipei Floral Picnic 2026) now links Pikachu to the existing
  Spring Hat costume ID `72`.
- Background `235` (10th Anniversary) links Gimmighoul to costume ID `331`.
- Backgrounds `241`, `242`, and `243` are the Valor, Instinct, and Mystic
  Professor Willow's Assistant backgrounds. Each links Pikachu to costume ID
  `332` and reuses the established team background artwork.

The repeatable authoring command is:

```bash
editor/.venv/bin/python editor/scripts/apply_costume_release_roster.py --apply
```
