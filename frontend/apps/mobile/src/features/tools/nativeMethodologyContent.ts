export type NativeMethodologySection = { title: string; eyebrow: string; paragraphs: string[]; bullets?: string[] };
export type NativeMethodologyPage = { title: string; eyebrow: string; description: string; sections: NativeMethodologySection[] };

export const raidMethodologyContent: NativeMethodologyPage = {
  eyebrow: 'RAID DOCUMENTATION', title: 'How raid rankings work',
  description: 'Pokémon Go Nexus separates general strength, type strength, and exact boss counters so one score is never asked to answer three different questions.',
  sections: [
    { eyebrow: 'THREE QUESTIONS', title: 'Choose the ranking that matches the decision', paragraphs: ['All types compares general raid strength against a neutral target. By type finds the strongest legal movesets for one attack type. Boss Counters evaluates one exact boss, form, tier, typing, and moveset.'], bullets: ['All types — broad team investment', 'By type — coverage for a weakness', 'Boss counters — one specific matchup'] },
    { eyebrow: 'VISIBLE SCORES', title: 'One list, several useful answers', paragraphs: ['eDPS accounts for the time a six-Pokémon team loses to relobbying. DPS measures active damage speed. TDO measures total output before fainting. ER blends speed and durability. CP provides investment context, not performance.'], bullets: ['ER = DPS^0.75 × TDO^0.25', 'eDPS = active damage ÷ (active time + relobby time)'] },
    { eyebrow: 'CALCULATION PIPELINE', title: 'Game data first, ranking second', paragraphs: ['Legal released forms and moves are built first. The model then applies Pokémon GO damage floors, STAB, exact type effectiveness, weather, friendship, Mega ally bonuses, and Shadow modifiers before ranking a target.'], bullets: ['Build legal attackers and movesets', 'Apply exact typing and battle modifiers', 'Model move timing, energy, fainting, and relobbies', 'Score the correct neutral, typed, or boss target'] },
    { eyebrow: 'MY POKÉMON', title: 'Personal rankings use recorded details', paragraphs: ['Caught copies stay separate and use their recorded level, IVs, CP, and moves. Entries without enough reliable detail are omitted instead of silently being promoted to level 50.'] },
    { eyebrow: 'ASSUMPTIONS', title: 'What the model can claim', paragraphs: ['Catalog rankings use perfect IVs at the selected level. Boss Counters is the exact event simulation; general and type rankings are planning models. Cached results include model and catalog versions so changed rules cannot silently reuse stale scores.'] },
  ],
};

export const pvpMethodologyContent: NativeMethodologyPage = {
  eyebrow: 'TRAINER BATTLE DOCUMENTATION', title: 'How PvP rankings work',
  description: 'Published rankings, caught-build context, team coverage, IV comparison, and battle simulation remain separate so every answer says what it measures.',
  sections: [
    { eyebrow: 'FOUR TOOLS', title: 'Choose the right question', paragraphs: ['Rankings presents the current source snapshot. IV Rank compares appraisal spreads. Team Builder evaluates three assigned roles. Battle Lab runs deterministic focused and team simulations.'], bullets: ['Rankings', 'IV Rank', 'Team Builder', 'Battle Lab'] },
    { eyebrow: 'PUBLISHED RANKINGS', title: 'A pinned simulation snapshot', paragraphs: ['League and cup rankings are imported from a pinned, attributable PvPoke snapshot and include recommended levels, IVs, moves, role scores, matchups, and counters.'] },
    { eyebrow: 'APPRAISAL COMPARISON', title: 'Every IV spread at its legal ceiling', paragraphs: ['IV Rank evaluates all 4,096 spreads at the highest legal half-level under the selected CP cap, then orders them by battle-stat product within the same species and form.'] },
    { eyebrow: 'MY POKÉMON', title: 'Recorded builds stay honest', paragraphs: ['Each eligible caught copy uses its recorded CP, level, IVs, Fast Move, and Charged Moves. Over-cap or incomplete entries are reported and omitted rather than guessed.'] },
    { eyebrow: 'LIMITS', title: 'Simulation supports decisions', paragraphs: ['A ranking snapshot and a local simulation are planning evidence, not a guarantee of live battle outcomes. Source attribution, deterministic fixtures, battle timelines, and regression cohorts guard the results.'] },
  ],
};

