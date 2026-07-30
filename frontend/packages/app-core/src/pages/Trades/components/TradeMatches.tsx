import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useModal } from '@/contexts/ModalContext';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { getTradeMatches } from '@/services/searchService';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  TradeMatchCard,
  TradeMatchPokemonSummary,
  TradeMatchQueryParams,
} from '@shared-contracts/search';

import './TradeMatches.css';

type TradeMatchesProps = {
  variants: PokemonVariant[];
};

type MatchFilters = {
  friendship: 'all' | 'friends';
  special: 'all' | 'special';
  range: 'all' | '5' | '25' | '100';
  pokemon: string;
};

const getVariant = (
  summary: TradeMatchPokemonSummary,
  variants: PokemonVariant[],
) => variants.find((variant) => variant.variant_id === summary.variant_id)
  ?? variants.find((variant) => variant.pokemon_id === summary.pokemon_id);

const displayName = (summary: TradeMatchPokemonSummary, variants: PokemonVariant[]) =>
  summary.nickname || getVariant(summary, variants)?.name || `Pokémon #${summary.pokemon_id}`;

const PokemonSummary = ({
  label,
  pokemon,
  variants,
}: {
  label: string;
  pokemon: TradeMatchPokemonSummary;
  variants: PokemonVariant[];
}) => {
  const variant = getVariant(pokemon, variants);
  return (
    <div className="trade-match-pokemon">
      <span>{label}</span>
      <img
        src={variant?.currentImage ?? '/images/default/placeholder.png'}
        alt=""
        loading="lazy"
      />
      <div>
        <strong>{displayName(pokemon, variants)}</strong>
        <small>
          {pokemon.cp ? `CP ${pokemon.cp}` : 'CP not listed'}
          {pokemon.shiny ? ' · Shiny' : ''}
          {pokemon.gigantamax ? ' · Gigantamax' : pokemon.dynamax ? ' · Dynamax' : ''}
        </small>
      </div>
    </div>
  );
};

const dustCost = (
  friendshipLevel: 1 | 2 | 3 | 4,
  special: boolean,
  registered: boolean,
) => {
  if (!special && registered) return 100;
  if (registered) {
    return ({ 1: 20_000, 2: 16_000, 3: 1_600, 4: 800 })[friendshipLevel];
  }
  if (special) {
    return ({ 1: 1_000_000, 2: 800_000, 3: 80_000, 4: 40_000 })[friendshipLevel];
  }
  return ({ 1: 20_000, 2: 16_000, 3: 1_600, 4: 800 })[friendshipLevel];
};

function TradeMatches({ variants }: TradeMatchesProps) {
  const [params] = useSearchParams();
  const { alert } = useModal();
  const proposeTrade = useTradeStore((state) => state.proposeTrade);
  const [matches, setMatches] = useState<TradeMatchCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string>();
  const [filters, setFilters] = useState<MatchFilters>({
    friendship: 'all',
    special: 'all',
    range: 'all',
    pokemon: '',
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<TradeMatchCard | null>(null);
  const [friendshipLevel, setFriendshipLevel] = useState<1 | 2 | 3 | 4>(1);
  const [lucky, setLucky] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sourceType = params.get('source_type');
  const sourceInstanceId = params.get('source_instance_id');
  const candidateInstanceId = params.get('candidate_instance_id');

  const query = useMemo<TradeMatchQueryParams>(() => ({
    source_type: sourceType === 'trade' || sourceType === 'wanted' ? sourceType : undefined,
    source_instance_id: sourceInstanceId || undefined,
    candidate_instance_id: candidateInstanceId || undefined,
    friendship: filters.friendship,
    special_trade: filters.special === 'special' ? true : undefined,
    range_km: filters.range === 'all' ? undefined : Number(filters.range),
    limit: 20,
  }), [candidateInstanceId, filters, sourceInstanceId, sourceType]);

  const load = useCallback(async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const result = await getTradeMatches({ ...query, cursor });
      setMatches((current) => cursor ? [...current, ...result.matches] : result.matches);
      setNextCursor(result.next_cursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Trade matches could not be loaded.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedMatch) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        setSelectedMatch(null);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedMatch, submitting]);

  const openProposal = (match: TradeMatchCard) => {
    setSelectedMatch(match);
    const level = match.trainer.friendship_level;
    setFriendshipLevel(level === 2 || level === 3 || level === 4 ? level : 1);
    setLucky(false);
  };

  const submitProposal = async () => {
    if (!selectedMatch || submitting) return;
    setSubmitting(true);
    const result = await proposeTrade({
      username_proposed: '',
      username_accepting: selectedMatch.trainer.username,
      pokemon_instance_id_user_proposed: selectedMatch.my_offer.instance_id,
      pokemon_instance_id_user_accepting: selectedMatch.their_offer.instance_id,
      is_special_trade: selectedMatch.is_special_trade,
      is_registered_trade: selectedMatch.is_registered_trade,
      is_lucky_trade: lucky,
      trade_dust_cost: dustCost(
        friendshipLevel,
        selectedMatch.is_special_trade,
        selectedMatch.is_registered_trade,
      ),
      trade_friendship_level: friendshipLevel,
      user_1_trade_satisfaction: null,
      user_2_trade_satisfaction: null,
      pokemon: {
        variant_id: selectedMatch.their_offer.variant_id ?? String(selectedMatch.their_offer.pokemon_id),
        instance_id: selectedMatch.their_offer.instance_id,
        instanceData: {},
      },
      trade_accepted_date: null,
      trade_cancelled_by: null,
      trade_cancelled_date: null,
      trade_completed_date: null,
      trade_proposal_date: new Date().toISOString(),
      trade_status: 'proposed',
      last_update: Date.now(),
    });
    setSubmitting(false);
    if (!result.success) {
      await alert(result.error || 'The trade proposal could not be created.');
      return;
    }
    setSelectedMatch(null);
    setMatches((current) => current.filter((match) => match.match_id !== selectedMatch.match_id));
    await alert('Trade proposal sent.');
  };

  const visibleMatches = useMemo(() => {
    const needle = filters.pokemon.trim().toLocaleLowerCase();
    if (!needle) return matches;
    return matches.filter((match) =>
      [
        displayName(match.my_offer, variants),
        displayName(match.my_wanted, variants),
        displayName(match.their_offer, variants),
        displayName(match.their_wanted, variants),
        match.trainer.username,
      ].some((value) => value.toLocaleLowerCase().includes(needle)),
    );
  }, [filters.pokemon, matches, variants]);

  return (
    <section className="trade-matches" aria-labelledby="trade-matches-heading">
      <div className="trade-matches-toolbar">
        <div>
          <h2 id="trade-matches-heading">
            {sourceInstanceId ? 'Matches for this Pokémon' : 'Reciprocal matches'}
          </h2>
          <p>Both trainers have something the other is looking for.</p>
        </div>
        <div className="trade-match-filters" aria-label="Match filters">
          <label>
            Pokémon or trainer
            <input
              type="search"
              value={filters.pokemon}
              placeholder="Filter matches"
              onChange={(event) => setFilters((current) => ({
                ...current,
                pokemon: event.target.value,
              }))}
            />
          </label>
          <label>
            Trainers
            <select
              value={filters.friendship}
              onChange={(event) => setFilters((current) => ({
                ...current,
                friendship: event.target.value as MatchFilters['friendship'],
              }))}
            >
              <option value="all">Everyone eligible</option>
              <option value="friends">Friends only</option>
            </select>
          </label>
          <label>
            Distance
            <select
              value={filters.range}
              onChange={(event) => setFilters((current) => ({
                ...current,
                range: event.target.value as MatchFilters['range'],
              }))}
            >
              <option value="all">Any visible distance</option>
              <option value="5">Within 5 km</option>
              <option value="25">Within 25 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </label>
          <label>
            Trade type
            <select
              value={filters.special}
              onChange={(event) => setFilters((current) => ({
                ...current,
                special: event.target.value as MatchFilters['special'],
              }))}
            >
              <option value="all">All trades</option>
              <option value="special">Special trades</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? <div className="trade-state-card">Finding your best matches…</div> : null}
      {!loading && error ? (
        <div className="trade-state-card error" role="alert">
          <strong>Matches are unavailable</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>Try again</button>
        </div>
      ) : null}
      {!loading && !error && visibleMatches.length === 0 ? (
        <div className="trade-state-card">
          <strong>No reciprocal matches yet</strong>
          <p>Keep your Wanted and For Trade preferences current. New matches will appear here.</p>
        </div>
      ) : null}

      <div className="trade-match-grid">
        {visibleMatches.map((match) => (
          <article className="trade-match-card" key={match.match_id}>
            <header>
              <div>
                <strong>{match.trainer.username}</strong>
                <span>
                  {match.trainer.is_friend ? 'Friend' : 'Eligible trainer'}
                  {typeof match.trainer.distance_km === 'number'
                    ? ` · ${match.trainer.distance_km.toFixed(1)} km away`
                    : ''}
                </span>
              </div>
              {match.is_special_trade ? <span className="special-trade-pill">Special trade</span> : null}
            </header>
            <div className="trade-match-exchange">
              <PokemonSummary label="You offer" pokemon={match.my_offer} variants={variants} />
              <span className="trade-match-swap" aria-hidden="true">⇄</span>
              <PokemonSummary label="They offer" pokemon={match.their_offer} variants={variants} />
            </div>
            <div className="trade-match-reasons">
              {match.match_reasons.map((reason) => <span key={reason}>{reason}</span>)}
            </div>
            <footer>
              <button
                type="button"
                className="trade-match-primary"
                disabled={!match.eligibility.can_propose}
                onClick={() => openProposal(match)}
              >
                Propose trade
              </button>
            </footer>
          </article>
        ))}
      </div>

      {nextCursor ? (
        <button
          type="button"
          className="trade-load-more"
          disabled={loadingMore}
          onClick={() => void load(nextCursor)}
        >
          {loadingMore ? 'Loading…' : 'Load more matches'}
        </button>
      ) : null}

      {selectedMatch ? (
        <div className="trade-composer-backdrop" role="presentation" onMouseDown={() => setSelectedMatch(null)}>
          <section
            className="trade-composer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trade-composer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>Proposal to {selectedMatch.trainer.username}</p>
                <h2 id="trade-composer-title">Review your trade</h2>
              </div>
              <button type="button" aria-label="Close trade proposal" onClick={() => setSelectedMatch(null)}>×</button>
            </header>
            <div className="trade-composer-exchange">
              <PokemonSummary label="You give" pokemon={selectedMatch.my_offer} variants={variants} />
              <span aria-hidden="true">⇄</span>
              <PokemonSummary label="You receive" pokemon={selectedMatch.their_offer} variants={variants} />
            </div>
            <div className="trade-composer-fields">
              <label>
                Friendship level
                <select value={friendshipLevel} onChange={(event) => setFriendshipLevel(Number(event.target.value) as 1 | 2 | 3 | 4)}>
                  <option value={1}>Good friend</option>
                  <option value={2}>Great friend</option>
                  <option value={3}>Ultra friend</option>
                  <option value={4}>Best friend</option>
                </select>
              </label>
              <label className="trade-composer-check">
                <input type="checkbox" checked={lucky} onChange={(event) => setLucky(event.target.checked)} />
                Plan this as a Lucky Trade
              </label>
            </div>
            <div className="trade-composer-notice">
              <strong>{dustCost(
                friendshipLevel,
                selectedMatch.is_special_trade,
                selectedMatch.is_registered_trade,
              ).toLocaleString()} Stardust estimated</strong>
              <span>{selectedMatch.is_special_trade ? 'This is a special trade.' : 'Standard trade.'} The server verifies availability when you send.</span>
            </div>
            <footer>
              <button type="button" onClick={() => setSelectedMatch(null)}>Not now</button>
              <button type="button" className="trade-match-primary" disabled={submitting} onClick={() => void submitProposal()}>
                {submitting ? 'Sending…' : 'Send proposal'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default TradeMatches;
