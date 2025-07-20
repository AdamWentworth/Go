// TrainerSearchBar.tsx
// ------------------------------------------------------------
// • If you’re using plain JS just delete the TrainerResult type
//   and change `useState<TrainerResult[]>([])` to `useState([])`.

import { useState, useEffect, ChangeEvent } from 'react';
import './TrainerSearchBar.css';

type TrainerResult = {
  username: string;
  pokemonGoName?: string | null;
};

const API_BASE = import.meta.env.VITE_USERS_API_URL ?? '';

const MIN_QUERY_LEN = 2;          // backend requires at least 2 chars
const DEBOUNCE_MS   = 300;

const TrainerSearchBar = () => {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<TrainerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ───── fetch on debounce ───── */
  useEffect(() => {
    // clear UI when the box is emptied
    if (!query.trim()) {
      setResults([]);
      setError('');
      return;
    }

    if (query.trim().length < MIN_QUERY_LEN) return;      // don’t hit API yet

    const id = setTimeout(() => void fetchTrainers(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  /* ───── API helper ───── */
  async function fetchTrainers(term: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${API_BASE}/autocomplete-trainers?q=${encodeURIComponent(term)}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        // try to surface backend message, otherwise show generic
        const msg =
          (await res.json().catch(() => null))?.message ??
          `Server returned ${res.status}`;
        throw new Error(msg);
      }

      const data: TrainerResult[] = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Trainer search error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch trainers.'
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  /* ───── render ───── */
  return (
    <div className="trainer-search-container">
      <p className="trainer-search-heading">Search Trainers</p>

      <input
        type="text"
        className="trainer-search-input"
        placeholder="Start typing a trainer's name…"
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value)
        }
      />

      {loading && <p className="trainer-search-status">Searching…</p>}
      {error && <p className="trainer-search-error">{error}</p>}

      {results.length > 0 && (
        <ul className="trainer-results">
          {results.map((t, i) => (
            <li key={`${t.username}-${i}`} className="trainer-result-item">
              <div>
                <strong>Username:</strong> {t.username}
              </div>
              <div>
                <strong>Pokémon GO name:</strong>{' '}
                {t.pokemonGoName ?? '—'}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading &&
        query.trim().length >= MIN_QUERY_LEN &&
        results.length === 0 &&
        !error && (
          <p className="trainer-search-empty">No trainers found.</p>
        )}
    </div>
  );
};

export default TrainerSearchBar;
