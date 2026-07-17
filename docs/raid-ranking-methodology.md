# Raid Attacker Ranking Methodology

Last reviewed: July 2026

Model version: 10

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

Boss counters use an event-driven battle simulation rather than the broad-list cycle formula. The engine models:

- the current half-second raid clock and processed move durations
- move energy committed at action start and damage applied when the move lands
- energy gained from incoming damage, including energy gained while a charged move is in progress
- exact damage floors, STAB, type effectiveness, weather, friendship, Mega ally, Party Power, and Shadow modifiers
- legal fast-and-charged boss movesets and the boss's charged-move decision opportunities
- attacker faints, one-second team swaps, an ordered mixed six-Pokemon team, and the selected relobby delay
- charged-only dodging that reserves the incoming damage window when the attacker is free to react, takes half a second, and reduces the hit to one quarter of normal damage
- multi-Trainer damage and the additional boss energy generated separately by every active Trainer's damage
- Party Power as an 18-point per-Trainer meter, with current two-, three-, and four-person fill rates, a one-second activation delay, persistence across faints, and a doubled next Charged Attack
- raid victory, simulated DPS, projected Time to Win, faints, relobbies, and trainer estimates

Expected mode simulates both deterministic phases of the boss's 50% charged-move decision rule for every legal boss moveset, then averages those results. Favorable and hostile modes select the actual legal moveset result with the lowest or highest projected Time to Win respectively; they do not apply a synthetic damage multiplier.

Monte Carlo mode runs a reproducible 32–64 trial distribution. Trials are stratified so every legal boss moveset is represented, while a seeded random stream chooses each eligible charged move at 50% probability and samples half-second-aligned boss action delays of 1.5, 2.0, or 2.5 seconds. Counter cards report median (P50) Time to Win and faints alongside P10–P90 timing and P90 faint/relobby pressure. Shared boss-scenario seeds prevent random refresh-to-refresh ranking noise.

To keep boss lookup responsive, the closed-form cycle model screens the catalog before simulation. A balanced pool of up to four browser workers then evaluates every legal moveset for up to 384 finalist attacker forms without blocking interaction on the page. Workers return only the best moveset for each form by default and return every simulated moveset when All moves is selected. The remaining form-level screen can omit an unusually weak-looking form whose event timeline would outperform its closed-form estimate, so the list is exhaustive within the finalist cohort rather than a proof over every catalog form.

Exact boss results are cached in IndexedDB for seven days, with a maximum of 12 result sets. The key includes model version, catalog version, boss and finalist stats/moves, raid tier, every simulation setting, and the Best moves/All moves choice. A rules change, catalog update, move/stat edit, or setting change therefore cannot silently reuse an incompatible result. Memory caching accelerates repeat calculations in the same session; IndexedDB avoids repeating them after a reload.

## Personalized rosters

Logged-in Trainers can switch Overall, By Type, and Boss Counters from the full catalog benchmark to **My Pokemon**. Each caught copy remains a separate attacker and uses its recorded level, IVs, CP, and current fast and Charged Attacks. Boss mode builds its six-Pokemon team from those distinct copies instead of cloning a single ideal catalog entry.

Generated teams also enforce battle-form legality. A team can contain at most one Mega Evolution or Primal Reversion, and one caught Pokemon cannot occupy both its base and transformed slots. Public comparison tables still show every eligible form independently so Trainers can compare investments; the restriction applies when the app turns those entries into a playable team estimate.

The selected catalog level never overrides a caught Pokemon's recorded level. If level is absent but CP and IVs are available, the closest legal level is inferred from the CP formula. A caught entry with insufficient level, IV, or current moveset data is omitted from personalized rankings instead of being promoted to catalog benchmark assumptions. Hidden Power uses the recorded move but marks its rolled type as estimated because the current instance schema does not store that roll.

Personalized rankings establish the input model needed for heterogeneous Trainer teams. Trainers can also opt into a local battle-calibration log from Boss mode. Each observation stores the boss, model and catalog versions, Trainer count, predicted and observed clear time, faints, relobbies, dodge attempts, successful dodges, and optional measured latency. The records stay in that browser and are scoped to the signed-in user.

Observed dodge success is not applied until the local profile contains at least five raids and ten dodge attempts. Even then, it only changes the success probability of dodges the timeline says were possible. Latency remains a diagnostic measurement: Pokemon GO uses a half-second battle clock and client-side action queuing, so adding raw ping to every move would create false precision. The standard model remains active unless the Trainer explicitly enables the qualified local dodge profile.

## Assumptions and limits

- Catalog rankings assume 15/15/15 IVs at the selected attacker level. Personalized rankings use each caught Pokemon's recorded or explicitly marked estimated values.
- Overall rankings use the documented neutral incoming-pressure approximation and therefore do not change with the historical boss mix.
- Type rankings default to the expected damage pressure across every legal fast-and-charged boss moveset. Ranking settings can instead show the favorable or hostile legal moveset for each boss. All three modes apply exact incoming damage floors and use boss STAB, weather, effectiveness against the attacker, processed move duration, and the current average raid action delay.
- Legal boss movesets are weighted equally because future raid moveset frequency is not known. Overall and type rankings remain closed-form planning models; only Boss mode runs the event simulation.
- Overall and By Type use a configurable cycle-average Party Power approximation. Boss mode simulates the meter event by event.
- The Party Power fill rates are current empirical behavior rather than a complete published Niantic formula: an 18-point meter receives one, two, or three points per landed move in a party of two, three, or four. Boss mode automatically uses the boost on the next eligible Charged Attack one second after the meter fills.
- Group estimates model a homogeneous group: every Trainer uses the displayed mixed team and shares the same action timeline. This reproduces group damage and boss-energy feedback, but not different teams, latency, staggered Mega uptime, or manual Party Power timing across individual Trainers.
- Charged-only dodging assumes the swipe succeeds whenever the attacker has not committed to an action that overlaps the damage window. An explicitly enabled, sufficiently sampled local profile can replace perfect execution with the Trainer's observed success rate.
- Expected mode represents boss cadence and the 50% charged decision with deterministic phases. Monte Carlo mode samples both, but 32–64 trials remain a browser-sized distribution rather than a large server-side convergence run.
- Raw latency is reported but not directly converted into per-move delay. Network delay, relobby healing bugs, and undocumented live-mechanics changes can still alter a real raid result.

For a specific difficult raid, use the boss counter page and confirm the result with a full battle simulator. For long-term investment and team building, the overall and type eDPS lists are the intended tools.

## Validation guardrails

The ranking model has complementary regression gates:

The current model settings, canonical headline order, independent-reference cohorts, tolerances, and loading budgets are also published as [machine-readable JSON](./raid-ranking-validation.json). CI verifies that its model version, cohort bounds, sample bounds, performance constants, and canonical movesets match the executable model.

- A fixed canonical cohort checks the headline order and legal signature moves for Mega Rayquaza, both Mega Mewtwo forms, Eternatus, Shadow Regigigas, and Zacian.
- Three independently maintained tools must agree on Mega Rayquaza as the released-form leader. Their published top cohorts must retain the configured overlap and relative-order tolerances. Raw scores are not compared directly because eDPS, ER, and Pokebattler Estimator answer different mathematical questions.
- A versioned six-boss Pokebattler matrix covers Dragon/Ice, Water, Ground, double-weak Fire, Fairy, and Dragon/Electric raid targets. Each scenario records six published reference contenders that are released and modelable in the live catalog, plus a comparison window and minimum overlap tolerance separate from the broad overall model.
- Battle-calibration tests lock local-only persistence, owner isolation, bounded retention, evidence thresholds, aggregate timing/faint/relobby errors, dodge success, and diagnostic latency.
- Generated-team tests enforce one Mega or Primal, distinct caught instances, and the stronger legal choice when a base form and its transformation compete for the same roster slot.
- A sensitivity matrix varies neutral target Defense across `160`, `180`, and `200`, and incoming pressure across `0.8x`, `1x`, and `1.2x`. The top-three order and signature charged moves must remain stable in all nine scenarios.
- Relobby delays of `0`, `5`, `10`, and `20` seconds must preserve the canonical headline result.
- Exact damage floors may legitimately change the preferred fast move at some Defense breakpoints. The validation therefore locks the stable rank and signature charged move across sensitivity scenarios while requiring the exact production-default moveset at the documented benchmark.
- Event-engine tests lock half-second action timing, start-of-action energy commitment, incoming-damage energy, charged-move use, faint cancellation, successful and blocked dodge timing, ordered mixed teams, multi-Trainer boss-energy feedback, Party Power fill/consumption, six-Pokemon relobbies, expected/favorable/hostile boss movesets, every legal finalist moveset, and the bounded browser candidate screen.
- Monte Carlo tests lock seeded reproducibility, sample bounds, ordered P10/P50/P90 distributions, legal-moveset aggregation, and the rendered uncertainty summaries.
- Cache tests discard the memory layer, restore the structured result from IndexedDB, and verify that a changed simulation setting misses the old entry.
- A browser regression verifies that the production worker bundle starts, completes an exhaustive finalist calculation, and renders its results.
- A browser performance regression measures the first useful Overall leaderboard render. Cold fixture-backed loads have an eight-second ceiling and warm IndexedDB-backed loads have a three-second ceiling; raid-event metadata is fetched concurrently and may not block the default Overall view.
- Live-catalog validation runs a real boss-counter simulation in addition to the broad canonical ranking gate.

Frontend CI runs the deterministic model gate. After every clean production catalog-editor session, the editor refreshes the API cache and runs the same canonical check against the live catalog. This catches move-pool, form-stat, and move-stat drift before a catalog edit is considered complete.

## Methodology comparison

The tiers below rank calculation methods for their stated purpose, not the amount of content or visual polish on each site.

| Tier | Tool | Strongest use | Advantages | Tradeoffs |
| --- | --- | --- | --- | --- |
| S | Pokebattler | Exact boss simulations | Models boss matchups, deaths, dodging choices, TTW, and relobby-aware Estimator results | More complex; results depend heavily on selected battle conditions |
| S | DialgaDex | Broad theoretical attacker rankings | Transparent DPS/TDO/eDPS choices, configurable team and relobby assumptions, and Type Affinity using real high-tier bosses | Still a closed-form ranking; no single broad score can reproduce every raid timeline |
| A+ | PokeGo Nexus | Explainable general planning plus integrated boss lookup | Neutral all-type benchmark, legal form-specific move pools and generated teams, independently scored tier-scaled type targets, exact damage floors, event-driven mixed-team boss counters, charged dodging, group boss-energy feedback, timed Party Power, seeded Monte Carlo percentiles, worker-pooled finalist movesets, durable versioned caching, expected/favorable/hostile legal boss attacks, real two-move type effectiveness, Hidden Power handling, sortable component metrics, and adjustable modifiers | Broad lists remain closed-form; browser-sized simulation still uses a bounded form screen and homogeneous Trainer groups |
| A | PokéBase | Transparent closed-form DPS and ER analysis | Publishes the Comprehensive DPS derivation and exposes DPS, TDO, ER, and CP | General formulas need a simulator for highly specific matchups; editorial type lists include manual judgment |
| A | Dittobase | Accessible eDPS rankings | Representative boss pool, relobby-aware eDPS, and extensive player-facing settings | Public explanations are strong, but less implementation detail is exposed than the formula-first tools |
| B | GO Hub Database | Quick type lists and counter references | EER/TER options and broad database integration | Some counter outputs are estimates and documented modifiers are not applied uniformly to every metric |
| B | Hundo Hunter | Fast curated recommendations | Clear composite score and explicit benchmarking against simulations | External tier weights and curation make the ranking less purely derived from raid mechanics |
| B | Doctor Pokegogo | Simple investment tiers | Public ER formula and approachable percentile grades | A compact bulk proxy cannot capture boss-specific tempo, faints, or relobby behavior |

### Where PokeGo Nexus stands

PokeGo Nexus is a **strong A+ broad ranking model with an event-driven boss-counter mode**. Its main advantage is auditability: the displayed eDPS, DPS, TDO, ER, CP, moveset, target selection, boss-pressure mode, and user modifiers all belong to one model instead of mixing a hidden score with editorial ordering. Overall uses a documented typeless benchmark so the historical boss roster cannot bias its movesets. By Type independently scores real high-tier raid targets instead of collapsing them into a same-typing aggregate.

Boss mode now includes reproducible Monte Carlo outcomes, legal mixed teams, charged dodging, group boss-energy feedback, timed Party Power, a six-boss independent-reference matrix, and opt-in observed dodge calibration. Public cohorts are calibration rather than an assertion that unlike scalar metrics should match. It is not yet equivalent to a large dedicated Pokebattler simulation. The clearest remaining path is:

1. Accumulate and review real observations across different bosses, group sizes, devices, and networks.
2. Support heterogeneous multi-Trainer teams, independent action timelines, and manual Party Power activation.
3. Compare calibrated predictions against an additional independent full simulator before tightening matrix tolerances.

The broad eDPS leaderboard should remain the default because it answers the most common team-building question. A future simulator should strengthen boss mode rather than replace the transparent general model.

## References

- [DialgaDex attacker rankings and calculation settings](https://www.dialgadex.com/?strongest=&t=Any)
- [PokéBase Comprehensive DPS derivation](https://pokebase.app/pokemon-go/p/how-to-calculate-comprehensive-dps)
- [PokéBase attacker-list methodology](https://pokebase.app/pokemon-go/p/best-attackers-by-type)
- [Pokebattler explanation of Estimator versus Time to Win](https://articles.pokebattler.com/2023/04/05/analysis-shadow-blaziken-and-shadow-sceptile-as-raid-attackers/)
- [Pokebattler Monte Carlo simulation methodology](https://articles.pokebattler.com/simulations/)
- [Pokebattler Rayquaza counter simulation](https://www.pokebattler.com/raids/defenders/RAYQUAZA/levels/RAID_LEVEL_5/attackers/levels/40/strategies/CINEMATIC_ATTACK_WHEN_POSSIBLE/DEFENSE_RANDOM_MC)
- [Pokebattler Kyogre counter simulation](https://www.pokebattler.com/raids/defenders/KYOGRE/levels/RAID_LEVEL_5/attackers/levels/40/strategies/CINEMATIC_ATTACK_WHEN_POSSIBLE/DEFENSE_RANDOM_MC)
- [Pokebattler Groudon counter simulation](https://www.pokebattler.com/raids/defenders/GROUDON/levels/RAID_LEVEL_5/attackers/levels/40/strategies/CINEMATIC_ATTACK_WHEN_POSSIBLE/DEFENSE_RANDOM_MC)
- [Pokebattler Kartana counter simulation](https://www.pokebattler.com/raids/defenders/KARTANA/levels/RAID_LEVEL_ULTRA_BEAST/attackers/levels/40/strategies/CINEMATIC_ATTACK_WHEN_POSSIBLE/DEFENSE_RANDOM_MC)
- [Pokebattler Xerneas counter simulation](https://www.pokebattler.com/raids/defenders/XERNEAS/levels/RAID_LEVEL_5/attackers/levels/40/strategies/CINEMATIC_ATTACK_WHEN_POSSIBLE/DEFENSE_RANDOM_MC)
- [Pokebattler Zekrom counter simulation](https://www.pokebattler.com/raids/defenders/ZEKROM/levels/RAID_LEVEL_5/attackers/levels/40/strategies/CINEMATIC_ATTACK_WHEN_POSSIBLE/DEFENSE_RANDOM_MC)
- [Niantic Party Play and Party Power help](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/4171-how-to-use-party-play/)
- [Current empirical Party Power meter research](https://9db.jp/pokemongo/data/23926)
- [Niantic raid dodging help](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2738-i-m-unable-to-defeat-a-raid-boss/)
- [Pokemon GO dodged-damage multiplier](https://bulbapedia.bulbagarden.net/wiki/Damage)
- [GamePress research into boss charged-move decisions and damage energy](https://pogo.gamepress.gg/new-discoveries-theory-battle-mechanics)
- [DialgaDex-style EER and TER usage in the GO Hub Database](https://db.pokemongohub.net/pokemon-list/best-per-type/electric)
- [Dittobase eDPS ranking methodology](https://www.dittobase.com/pokemon-go/best-attackers/flying)
- [Hundo Hunter raid ranking methodology](https://www.hundo-hunter.com/methodology/raid-rankings)
- [Doctor Pokegogo rating methodology](https://doctorpokegogo.com/en/rating-methodology/)

Pokemon and Pokemon GO are trademarks of their respective owners. PokeGo Nexus is not affiliated with or endorsed by Niantic, Scopely, The Pokemon Company, or Nintendo.
