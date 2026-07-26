# Shadow and Shiny Shadow release review

Reviewed on 2026-07-26.

## Eligibility rule

Pokémon GO's Memories in Motion season began on 2026-03-03 at 10:00
local time. From that date forward, any Pokémon rescued from Team GO
Rocket can be Shiny when both its normal Shiny and Shadow form have been
released.

For each catalog form, PokeGoNexus now derives the earliest valid Shiny
Shadow date as follows:

1. The normal Shiny and Shadow form must both be available.
2. Existing earlier Shiny Shadow releases remain valid.
3. Otherwise, eligibility begins on the latest of the normal Shiny
   release, Shadow release, and 2026-03-03.
4. Purified and Shiny Purified availability continues to derive from
   the corresponding Shadow and Shiny Shadow forms.

## Sources

- Official season announcement:
  <https://pokemongo.com/en/seasons/memories-in-motion>
- Shadow release roster:
  <https://bulbapedia.bulbagarden.net/wiki/List_of_Shadow_Pok%C3%A9mon_in_Pok%C3%A9mon_GO>
- Pinned Shadow roster revision used by the updater: `4594411`

The source revision contains 486 released Shadow rows and 16 explicitly
unobtainable rows. PokeGoNexus maps those releases to 478 Pokémon/form
rows and 9 costume rows. The extra Pokémon/form row is the catalog's
authored female Unfezant visual, which follows Unfezant's release data.

## Catalog result

- Released Shadow Pokémon/forms: 478
- Released Shiny Shadow Pokémon/forms: 473
- Released Shadow costumes: 9
- Released Shiny Shadow costumes: 9

The previous catalog had release dates for 412 Shadow Pokémon/forms and
Shiny eligibility for 138 of them. Placeholder Shadow rows without a
release date remain unavailable.

Rookidee, Corvisquire, and Corviknight had released normal Shiny artwork
but stale availability metadata. Their normal Shiny release is corrected
to 2026-06-25 before Shiny Shadow eligibility is derived.

## Newly synchronized Shadow lines

- 2025-08-11: Staryu, Starmie, Giratina (Altered), Fletchling line,
  Pikipek line, and Grubbin line
- 2025-09-16: Qwilfish, Swablu line, Baltoy line, Feebas line, Deino
  line, and Tornadus
- 2025-10-21: Yamask line and Phantump line
- 2025-11-07: Darkrai
- 2026-01-23: Krabby line, Thundurus, Chespin line, Fennekin line, and
  Froakie line
- 2026-04-30: Landorus, Helioptile line, Dewpider line, Morelull line,
  and Stufful line
- 2026-06-25: Ponyta line, Seel line, Kabuto line, Hoothoot line, Axew
  line, Reshiram, Noibat line, and Rookidee line

The updater fails closed if the pinned source count, form mapping,
expected catalog totals, or required image inputs drift.
