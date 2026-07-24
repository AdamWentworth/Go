import { useCallback } from 'react';
import {
  FaArrowLeft,
  FaBolt,
  FaCalculator,
  FaFlask,
  FaShieldAlt,
  FaUsers,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

import { useContextBackHandler } from '@/contexts/ContextBackContext';
import './PvpMethodology.css';

const rankingViews = [
  {
    title: 'Rankings',
    summary: 'A source-backed snapshot of the current competitive field.',
    detail:
      'Overall and role scores, recommended builds, matchup evidence, and counters come from the pinned PvPoke source snapshot for the selected league or cup.',
    icon: FaShieldAlt,
  },
  {
    title: 'IV Rank',
    summary: 'A same-species comparison of every appraisal spread.',
    detail:
      'IV Rank powers all 4,096 Attack, Defense, and HP combinations to their highest legal half-level, then orders them by battle-stat product for the selected league.',
    icon: FaCalculator,
  },
  {
    title: 'Team Builder',
    summary: 'A quick read on shared weaknesses and available coverage.',
    detail:
      'The builder compares the documented matchups and counters for three selected Pokémon. It finds exposed threats and suggests candidates that cover them.',
    icon: FaUsers,
  },
  {
    title: 'Battle Lab',
    summary: 'A deterministic 1v1 test with configurable battle conditions.',
    detail:
      'The lab runs the selected builds through PokeGo Nexus simulation code with chosen shields and starting energy. It is a focused matchup test, not a full team battle.',
    icon: FaFlask,
  },
];

const PvpMethodology = () => {
  const navigate = useNavigate();

  const returnToPvp = useCallback(() => {
    navigate('/pvp');
    return true;
  }, [navigate]);

  useContextBackHandler(true, returnToPvp, 'pvp-methodology');

  return (
    <article className="pvp-methodology-page">
      <div className="pvp-methodology-shell">
        <header className="pvp-methodology-header">
          <Link className="pvp-methodology-back" to="/pvp">
            <FaArrowLeft aria-hidden="true" />
            <span>PvP tools</span>
          </Link>

          <p className="pvp-methodology-eyebrow">Trainer Battle documentation</p>
          <h1>How PvP rankings work</h1>
          <p className="pvp-methodology-intro">
            PokeGo Nexus keeps published rankings, caught-build context, team
            coverage, and direct battle simulation separate so each answer
            says exactly what it measures.
          </p>
        </header>

        <nav className="pvp-methodology-nav" aria-label="Methodology sections">
          <a href="#tools">Four tools</a>
          <a href="#rankings">Rankings</a>
          <a href="#iv-rank">IV Rank</a>
          <a href="#owned">My Pokémon</a>
          <a href="#cups">Cups</a>
          <a href="#battle-lab">Battle Lab</a>
          <a href="#limits">Limits</a>
        </nav>

        <main className="pvp-methodology-content">
          <section id="tools" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Choose the right question</p>
            <h2>One workspace, four different jobs</h2>
            <div className="pvp-methodology-tool-list">
              {rankingViews.map(({ title, summary, detail, icon: Icon }) => (
                <article key={title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <strong>{summary}</strong>
                    <p>{detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="rankings" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Published rankings</p>
            <h2>A pinned simulation snapshot</h2>
            <p>
              League and cup rankings are imported from a pinned, attributable
              PvPoke source snapshot. PokeGo Nexus maps released forms to its
              own catalog and presents the source&apos;s recommended level, IVs,
              moves, overall score, role scores, matchups, and counters.
            </p>
            <ol className="pvp-methodology-steps">
              <li>
                <strong>Pick a legal format.</strong>
                <span>
                  Great, Ultra, and Master League remain permanent choices.
                  Visible source cups are imported as independent ranking
                  snapshots with their own eligibility rules.
                </span>
              </li>
              <li>
                <strong>Choose the decision role.</strong>
                <span>
                  Overall, Lead, Closer, Switch, Charger, Attacker, and
                  Consistency expose the source&apos;s separate category scores
                  instead of pretending one order answers every team need.
                </span>
              </li>
              <li>
                <strong>Inspect the evidence.</strong>
                <span>
                  Expanded rows show the recommended battle stats, role
                  profile, strong matchups, key threats, and simulated move
                  usage available in that source snapshot.
                </span>
              </li>
            </ol>
          </section>

          <section id="iv-rank" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Appraisal comparison</p>
            <h2>Every IV spread at its legal ceiling</h2>
            <p>
              IV Rank compares all 4,096 possible 0-15 Attack, Defense, and HP
              appraisal combinations for one species or battle-stat form. Each
              spread is powered to the highest legal half-level under the
              selected league&apos;s CP cap, up to level 50 or Best Buddy level
              51.
            </p>
            <p>
              My Pokémon omits copies already above the selected league&apos;s CP
              cap, then recommends eligible copies using both current league
              relevance and species-specific IV quality. The browser weighs the
              format simulation score at 70% and the copy&apos;s IV percentile at
              30%, while showing both source ranks beside every recommendation.
            </p>
            <ol className="pvp-methodology-steps">
              <li>
                <strong>Calculate the legal level and CP.</strong>
                <span>
                  Great and Ultra League stop at 1,500 and 2,500 CP. Master
                  League has no CP cap, so perfect IVs lead at the selected
                  level ceiling.
                </span>
              </li>
              <li>
                <strong>Measure the battle stats.</strong>
                <span>
                  The model calculates the resulting Attack, Defense, and
                  floored HP at that level, then multiplies those three values
                  into the spread&apos;s stat product.
                </span>
              </li>
              <li>
                <strong>Rank like against like.</strong>
                <span>
                  Results are ordered by stat product within that species and
                  form. The percentile describes bulk-efficient CP use, not a
                  Pokémon&apos;s matchup strength against other species.
                </span>
              </li>
            </ol>
          </section>

          <section id="owned" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Personal roster</p>
            <h2>My Pokémon keeps the build honest</h2>
            <p>
              Each eligible caught copy uses its recorded CP, level, IVs, Fast
              Move, and two Charged Moves. The page does not silently promote a
              caught Pokémon to the catalog&apos;s recommended level or IV spread.
            </p>
            <div className="pvp-methodology-callout">
              <FaBolt aria-hidden="true" />
              <p>
                Rankings evaluates each recorded build in a browser worker
                against a fixed field of up to 12 top, battle-ready opponents
                from the selected format. The Pokémon service delivers
                versioned catalog data; it does not perform this personal
                roster work.
              </p>
            </div>
            <p>
              Each result starts from the published species score, then
              measures the caught build and its reference build against the
              same field with the standard Lead, Closer, Switch, Charger, and
              Attacker shield and energy scenarios. Their relative performance
              adjusts the published score for the caught Pokémon&apos;s actual
              level, IVs, stats, and moves without inventing a new global tier
              list.
            </p>
            <p>
              Entries over the format&apos;s CP cap, missing required battle
              details, or unavailable in the selected ranking snapshot are
              reported and omitted rather than guessed. If personal evaluation
              is unavailable, the page labels its temporary species baseline
              instead of presenting it as a build result. Completed evaluations
              are cached on the device by model, format, field, and roster.
            </p>
          </section>

          <section id="cups" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Current cups</p>
            <h2>Separate formats, not client-side filters</h2>
            <p>
              A cup is included only when the pinned source marks it visible
              and rankable and provides ranking data. Its list, scores, builds,
              matchups, and rules are imported independently; an Open League
              table is never merely filtered down and relabeled as a cup.
            </p>
          </section>

          <section id="battle-lab" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Direct simulation</p>
            <h2>Exact builds in a controlled 1v1</h2>
            <p>
              Battle Lab uses the pinned <code>pvpoke-legacy</code> mechanics
              implemented by the PokeGo Nexus Pokémon service. It models move
              turns, damage, energy, shields, Charged Move decisions, stat
              stages, and deterministic buff activation for the two selected
              fighters.
            </p>
            <div className="pvp-methodology-facts" aria-label="Battle Lab inputs">
              <span>
                <strong>0-2</strong>
                Shields per side
              </span>
              <span>
                <strong>0-100</strong>
                Starting energy
              </span>
              <span>
                <strong>1v1</strong>
                Focused matchup
              </span>
            </div>
          </section>

          <section id="limits" className="pvp-methodology-section">
            <p className="pvp-methodology-kicker">Limits and guardrails</p>
            <h2>What these tools do not claim</h2>
            <ul className="pvp-methodology-limit-list">
              <li>
                A ranking score summarizes a defined competitive field; it
                does not predict every opponent, team order, or player choice.
              </li>
              <li>
                Team Builder analyzes published matchup evidence. It does not
                simulate switches, alignment, energy carryover, or an entire
                three-Pokémon battle.
              </li>
              <li>
                Battle Lab is a deterministic 1v1. It does not yet model team
                swaps, switch timers, team sequencing, or live human latency.
              </li>
              <li>
                Rankings and current cups change only when the pinned source
                and PokeGo Nexus catalog are refreshed and republished.
              </li>
              <li>
                IV Rank measures stat product. Breakpoints, specific matchups,
                Best Buddy availability, and team composition can make a
                lower-ranked spread preferable in practice.
              </li>
              <li>
                Only catalog forms that PokeGo Nexus can identify and display
                are published. Unmatched or unreleased entries are omitted.
              </li>
            </ul>
            <p className="pvp-methodology-validation">
              Import validation, source-format tests, catalog matching tests,
              battle parity fixtures, API contract tests, and responsive
              browser checks guard this workflow.
            </p>
          </section>
        </main>

        <footer className="pvp-methodology-footer">
          <Link className="pvp-methodology-return" to="/pvp">
            <FaArrowLeft aria-hidden="true" />
            Return to PvP tools
          </Link>
          <p>
            Ranking data is attributed to PvPoke under its published license.
            IV Rank follows the established same-species stat-product model
            used by tools such as Stadium Gaming.
            Pokémon and Pokémon GO are trademarks of their respective owners.
          </p>
        </footer>
      </div>
    </article>
  );
};

export default PvpMethodology;
