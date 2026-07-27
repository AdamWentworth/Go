# Shiny Rarity Source Review - 2026-07-26

This audit reconciles the Shiny ownership survey used by the fake-user rarity
model with the production Pokemon catalog. Survey ownership is evidence for
rarity weighting, not an authority for release availability.

## Catalog repairs

The guarded ordinary-Shiny roster now includes the following previously
omitted, asset-backed releases:

- Quaxly, Quaxwell, and Quaquaval (2025-07-20)
- Tandemaus and both Maushold forms (2025-08-06)
- Salandit and Salazzle (official release 2025-08-11)
- Dondozo (2025-08-25)
- Wiglett and Wugtrio (2025-07-29)
- Female and Male Indeedee (2025-09-16)
- Duraludon (2025-09-30)
- both Sinistea and Polteageist forms (2025-10-21)
- Hatenna, Hattrem, and Hatterene (2025-11-07)
- Impidimp, Morgrem, and Grimmsnarl (2025-11-07)
- Unown K and Unown W (2025-11-07)
- Morpeko (2025-11-18)
- Keldeo (2025-11-25)
- Pikipek, Trumbeak, and Toucannon (2025-11-30)
- Tinkatink, Tinkatuff, and Tinkaton (2026-04-11)

## Source policy

Release dates were reconciled against the current Bulbapedia Pokemon GO Shiny
release table and official Pokemon GO event announcements where available. The
updater remains pinned to the reviewed source revision encoded in
`apply_shiny_release_roster.py`.
