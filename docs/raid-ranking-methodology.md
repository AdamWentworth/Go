# Raid Attacker Ranking Methodology

Last reviewed: July 2026

Model version: 4

PokeGo Nexus ranks raid attackers for three different questions:

1. **Overall:** Which released attacker and legal moveset has the strongest general output against a neutral benchmark?
2. **By type:** Which attacker performs best when a selected attack type is useful?
3. **Boss counters:** Which attacker deals damage fastest to one selected raid boss?

Those questions are related, but they are not interchangeable. A universal ranking is a planning aid, while a boss counter list is matchup-specific.

## Default metric

The default leaderboard uses **eDPS (effective damage per second)**. It starts with sustained DPS, estimates how long each attacker survives, and subtracts the downtime of reviving and rejoining after a six-Pokemon team faints.

PokeGo Nexus exposes every component so users can choose a different answer:

| Metric | What it measures | Best used for | Main limitation |
| --- | --- | --- | --- |
| DPS | Damage dealt per active second | Speed, large groups, and no-wipe scenarios | Rewards fragile attackers even when they cause an extra relobby |
| TDO | Damage dealt before fainting | Survivability and resource efficiency | Can overvalue slow, bulky attackers |
| ER | `DPS^0.75 x TDO^0.25` | A familiar balance of speed and bulk | It is a fitted proxy, not elapsed raid time |
| eDPS | Active damage divided by active time plus relobby downtime | General six-Pokemon raid teams | Depends on the selected relobby time and team-size assumption |
| CP | In-game combat power at the selected level | Investment context | CP is not a raid-performance metric |

The default eDPS model uses six identical attackers and a configurable relobby delay of 10 seconds:

```text
active_seconds = (TDO / DPS) x 6
eDPS = (DPS x active_seconds) / (active_seconds + relobby_seconds)
```

## Damage model

Move damage follows the Pokemon GO raid damage structure:

```text
damage = floor(0.5 x power x attack / defense x multipliers) + 1
```

The multipliers include:

- STAB when the move matches an attacker type
- the move's actual effectiveness against both target types
- weather, friendship, Mega ally, Shadow, and Party Power settings
- the Shadow attack bonus and corresponding defense penalty

All rankings use legal fast and charged move pools for the exact form. Fusion forms, Mega forms, legacy moves, and Hidden Power types are evaluated separately where applicable. Cosmetic, Dynamax, and Gigantamax duplicates are excluded because they do not create distinct raid attackers.

Sustained DPS uses the Comprehensive DPS approach: move duration, energy generation, energy gained from incoming damage, charged-move timing, and energy wasted on fainting all influence the result. One-bar charged moves receive an overcharge adjustment.

## Target models

### Overall rankings

Overall rankings use one neutral, typeless benchmark rather than the historical raid-boss catalog. Every move deals neutral damage, so a coverage move cannot win merely because the catalog happens to contain more bosses weak to its type. This is the same separation used by established all-type damage tables: Overall measures general moveset output, while By Type and Boss mode answer matchup questions.

The neutral benchmark currently uses:

- target Defense: `180`
- incoming DPS estimate: `1340 / attacker Defense`
- estimated final charged-hit damage: `11670 / attacker Defense`
- neutral `1x` effectiveness for every move type

Those generic incoming-pressure estimates feed Comprehensive DPS, TDO, ER, and eDPS without favoring a particular offensive or defensive type. Exact damage floors still apply. If two Hidden Power rolls have an identical neutral score, the displayed roll is selected by high-tier boss coverage as a presentation tie-break; that tie-break does not alter the attacker's metrics or rank.

### Type rankings

A Pokemon is eligible when at least one move matches the selected type. Targets are the same independently scored high-tier raid bosses weak to that type, including their tier-scaled stats and legal move pools. Because no boss is weak to Normal, that page uses high-tier bosses taking neutral Normal damage. The matching move receives its real effectiveness against each boss, while the companion move keeps its own type effectiveness. An off-type companion move is therefore neither silently boosted nor discarded.

### Boss counters

Boss mode uses the selected boss's form, typing, raid tier, HP, defense, timer, and Shadow enrage state. It evaluates every legal fast-and-charged move combination against that exact target.

The current boss result is a deterministic cycle estimate. It is useful for quick comparison, but it is not yet a frame-by-frame simulation of every possible boss moveset, dodge decision, faint, and relobby.

## Assumptions and limits

- Rankings assume 15/15/15 IVs at the selected attacker level.
- Overall rankings use the documented neutral incoming-pressure approximation and therefore do not change with the historical boss mix.
- Type rankings default to the expected damage pressure across every legal fast-and-charged boss moveset. Ranking settings can instead show the favorable or hostile legal moveset for each boss. All three modes apply exact incoming damage floors and use boss STAB, weather, effectiveness against the attacker, processed move duration, and the current average raid action delay.
- Legal boss movesets are weighted equally in expected mode because future raid moveset frequency is not known; type rankings do not simulate a random event timeline.
- Party Power is a configurable cycle-average approximation rather than a simulation of the live meter.
- Boss counter trainer counts include safety margins, but they remain estimates.
- Breakpoints, dodging, network delay, boss move randomness, party composition, and staggered Mega uptime can change a real raid result.

For a specific difficult raid, use the boss counter page and confirm the result with a full battle simulator. For long-term investment and team building, the overall and type eDPS lists are the intended tools.

## Validation guardrails

The ranking model has two complementary regression gates:

- A fixed canonical cohort checks the headline order and legal signature moves for Mega Rayquaza, both Mega Mewtwo forms, Eternatus, Shadow Regigigas, and Zacian.
- A sensitivity matrix varies neutral target Defense across `160`, `180`, and `200`, and incoming pressure across `0.8x`, `1x`, and `1.2x`. The top-three order and signature charged moves must remain stable in all nine scenarios.
- Relobby delays of `0`, `5`, `10`, and `20` seconds must preserve the canonical headline result.
- Exact damage floors may legitimately change the preferred fast move at some Defense breakpoints. The validation therefore locks the stable rank and signature charged move across sensitivity scenarios while requiring the exact production-default moveset at the documented benchmark.

Frontend CI runs the deterministic model gate. After every clean production catalog-editor session, the editor refreshes the API cache and runs the same canonical check against the live catalog. This catches move-pool, form-stat, and move-stat drift before a catalog edit is considered complete.

## Methodology comparison

The tiers below rank calculation methods for their stated purpose, not the amount of content or visual polish on each site.

| Tier | Tool | Strongest use | Advantages | Tradeoffs |
| --- | --- | --- | --- | --- |
| S | Pokebattler | Exact boss simulations | Models boss matchups, deaths, dodging choices, TTW, and relobby-aware Estimator results | More complex; results depend heavily on selected battle conditions |
| S | DialgaDex | Broad theoretical attacker rankings | Transparent DPS/TDO/eDPS choices, configurable team and relobby assumptions, and Type Affinity using real high-tier bosses | Still a closed-form ranking; no single broad score can reproduce every raid timeline |
| A | PokeGo Nexus | Explainable general planning plus integrated boss lookup | Neutral all-type benchmark, legal form-specific move pools, independently scored tier-scaled type targets, exact damage floors, expected/favorable/hostile legal boss attacks, real two-move type effectiveness, Hidden Power handling, sortable component metrics, and adjustable modifiers | Broad lists use closed-form moveset scenarios; boss mode is not yet a full event simulation |
| A | PokéBase | Transparent closed-form DPS and ER analysis | Publishes the Comprehensive DPS derivation and exposes DPS, TDO, ER, and CP | General formulas need a simulator for highly specific matchups; editorial type lists include manual judgment |
| A | Dittobase | Accessible eDPS rankings | Representative boss pool, relobby-aware eDPS, and extensive player-facing settings | Public explanations are strong, but less implementation detail is exposed than the formula-first tools |
| B | GO Hub Database | Quick type lists and counter references | EER/TER options and broad database integration | Some counter outputs are estimates and documented modifiers are not applied uniformly to every metric |
| B | Hundo Hunter | Fast curated recommendations | Clear composite score and explicit benchmarking against simulations | External tier weights and curation make the ranking less purely derived from raid mechanics |
| B | Doctor Pokegogo | Simple investment tiers | Public ER formula and approachable percentile grades | A compact bulk proxy cannot capture boss-specific tempo, faints, or relobby behavior |

### Where PokeGo Nexus stands

PokeGo Nexus is a **strong A-tier broad ranking model**. Its main advantage is auditability: the displayed eDPS, DPS, TDO, ER, CP, moveset, target selection, boss-pressure mode, and user modifiers all belong to one model instead of mixing a hidden score with editorial ordering. Overall uses a documented typeless benchmark so the historical boss roster cannot bias its movesets. By Type independently scores real high-tier raid targets instead of collapsing them into a same-typing aggregate.

It is not yet S-tier for exact boss simulation. The clearest path there is:

1. Add an event-driven boss simulator over every legal boss fast and charged moveset.
2. Report average, best-case, and worst-case TTW, faints, and relobbies.
3. Add no-dodge and realistic-dodge modes.
4. Extend the existing canonical and sensitivity regression gates with a machine-readable comparison against at least one independent full simulator.
5. Publish the catalog version, model version, assumptions, and last validation date with every ranking.

The broad eDPS leaderboard should remain the default because it answers the most common team-building question. A future simulator should strengthen boss mode rather than replace the transparent general model.

## References

- [DialgaDex attacker rankings and calculation settings](https://www.dialgadex.com/?strongest=&t=Any)
- [PokéBase Comprehensive DPS derivation](https://pokebase.app/pokemon-go/p/how-to-calculate-comprehensive-dps)
- [PokéBase attacker-list methodology](https://pokebase.app/pokemon-go/p/best-attackers-by-type)
- [Pokebattler explanation of Estimator versus Time to Win](https://articles.pokebattler.com/2023/04/05/analysis-shadow-blaziken-and-shadow-sceptile-as-raid-attackers/)
- [DialgaDex-style EER and TER usage in the GO Hub Database](https://db.pokemongohub.net/pokemon-list/best-per-type/electric)
- [Dittobase eDPS ranking methodology](https://www.dittobase.com/pokemon-go/best-attackers/flying)
- [Hundo Hunter raid ranking methodology](https://www.hundo-hunter.com/methodology/raid-rankings)
- [Doctor Pokegogo rating methodology](https://doctorpokegogo.com/en/rating-methodology/)

Pokemon and Pokemon GO are trademarks of their respective owners. PokeGo Nexus is not affiliated with or endorsed by Niantic, Scopely, The Pokemon Company, or Nintendo.
