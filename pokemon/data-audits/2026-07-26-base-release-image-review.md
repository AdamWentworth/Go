# Base Release Image Review - 2026-07-26

This batch covers 44 released species missing from the public PokeGo Nexus
catalog, represented by 55 catalog rows where Pokémon GO exposes distinct
forms. It deliberately does not change shiny, shadow, or costume availability.
The audit is cut off at July 22, 2026; announced August 18 releases such as
Cramorant, Arrokuda, and Barraskewda are intentionally excluded.

Run the live checklist from the repository root:

```bash
editor/.venv/bin/python editor/scripts/apply_base_release_roster.py --report-images
```

Release metadata and dates may be published while normal artwork is pending.
The frontend uses its standard Pokémon fallback image for those entries, while
this report remains the checklist for replacing each fallback with reviewed
artwork. Artwork readiness must never cause a released Pokémon to be labeled
unreleased.

## Existing Normal Images To Review

- `pokemon_679.png` - Honedge
- `pokemon_680.png` - Doublade
- `pokemon_681.png` - Aegislash (Shield)
- `pokemon_778.png` - Mimikyu (Busted)
- `pokemon_807.png` - Zeraora
- `pokemon_824.png` - Blipbug
- `pokemon_825.png` - Dottler
- `pokemon_826.png` - Orbeetle
- `pokemon_837.png` - Rolycoly
- `pokemon_838.png` - Carkol
- `pokemon_839.png` - Coalossal
- `pokemon_843.png` - Silicobra
- `pokemon_844.png` - Sandaconda
- `pokemon_852.png` - Clobbopus
- `pokemon_853.png` - Grapploct
- `pokemon_859.png` - Impidimp
- `pokemon_860.png` - Morgrem
- `pokemon_872.png` - Snom
- `pokemon_873.png` - Frosmoth
- `pokemon_876.png` - Indeedee (Female)

## Missing Normal Images To Add

- `pokemon_2345.png` - Aegislash (Blade)
- `pokemon_2269.png` - Mimikyu (Disguised)
- `pokemon_2286.png` - Indeedee (Male)
- `pokemon_917.png` - Tarountula
- `pokemon_918.png` - Spidops
- `pokemon_931.png` - Squawkabilly (Green Plumage)
- `pokemon_2346.png` - Squawkabilly (Blue Plumage)
- `pokemon_2347.png` - Squawkabilly (Yellow Plumage)
- `pokemon_2348.png` - Squawkabilly (White Plumage)
- `pokemon_932.png` - Nacli
- `pokemon_933.png` - Naclstack
- `pokemon_934.png` - Garganacl
- `pokemon_940.png` - Wattrel
- `pokemon_941.png` - Kilowattrel
- `pokemon_948.png` - Toedscool
- `pokemon_949.png` - Toedscruel
- `pokemon_950.png` - Klawf
- `pokemon_955.png` - Flittle
- `pokemon_956.png` - Espathra
- `pokemon_968.png` - Orthworm
- `pokemon_969.png` - Glimmet
- `pokemon_970.png` - Glimmora
- `pokemon_973.png` - Flamigo
- `pokemon_977.png` - Dondozo
- `pokemon_978.png` - Tatsugiri (Curly Form)
- `pokemon_2349.png` - Tatsugiri (Droopy Form)
- `pokemon_2350.png` - Tatsugiri (Stretchy Form)
- `pokemon_982.png` - Dudunsparce (Two-Segment Form)
- `pokemon_2351.png` - Dudunsparce (Three-Segment Form)
- `pokemon_1011.png` - Dipplin
- `pokemon_1012.png` - Poltchageist (Counterfeit Form)
- `pokemon_2352.png` - Poltchageist (Artisan Form)
- `pokemon_1013.png` - Sinistcha (Unremarkable Form)
- `pokemon_2353.png` - Sinistcha (Masterpiece Form)
- `pokemon_1019.png` - Hydrapple

Images belong under `assets/images/default/`. Shiny artwork will be audited in
the separate shiny-release batch and is not required to publish this base batch.

## Release Sources

- Pokémon GO availability chronology:
  <https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_availability_%28GO%29>
- Pokémon GO announcements:
  <https://pokemongo.com/news>
- Pinned Pokémon GO Game Master data:
  <https://github.com/PokeMiners/game_masters/tree/5ac6c0edd9315644d5ead8f45847157126ba73cd>
