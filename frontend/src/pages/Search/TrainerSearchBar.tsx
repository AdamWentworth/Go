// TrainerSearchBar.tsx
import { useState, useEffect, ChangeEvent } from 'react';
import './TrainerSearchBar.css';
import { createScopedLogger } from '@/utils/logger';
import { fetchTrainerAutocomplete } from '@/services/userSearchService';

type TrainerResult = {
  username: string;
  pokemonGoName?: string | null;
};

const log = createScopedLogger('TrainerSearchBar');

const MIN_QUERY_LEN = 2; // backend requires at least 2 chars
const DEBOUNCE_MS = 300;

const TrainerSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrainerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear UI when the box is emptied.
    if (!query.trim()) {
      setResults([]);
      setError('');
      return;
    }

    // Do not hit API until minimum query length.
    if (query.trim().length < MIN_QUERY_LEN) return;

    const id = setTimeout(() => void fetchTrainers(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  async function fetchTrainers(term: string) {
    setLoading(true);
    setError('');

    try {
      const outcome = await fetchTrainerAutocomplete(term);
      if (outcome.type === 'error') {
        throw new Error(outcome.message);
      }
      setResults(outcome.results);
    } catch (err) {
      log.error('Trainer search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trainers.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="trainer-search-container">
      <p className="trainer-search-heading">Search Trainers</p>

      <input
        type="text"
        className="trainer-search-input"
        placeholder="Start typing a trainer's name..."
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      />

      {loading && <p className="trainer-search-status">Searching...</p>}
      {error && <p className="trainer-search-error">{error}</p>}

      {results.length > 0 && (
        <ul className="trainer-results">
          {results.map((trainer, index) => (
            <li key={`${trainer.username}-${index}`} className="trainer-result-item">
              <div>
                <strong>Username:</strong> {trainer.username}
              </div>
              <div>
                <strong>Pokemon GO name:</strong> {trainer.pokemonGoName ?? '-'}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim().length >= MIN_QUERY_LEN && results.length === 0 && !error && (
        <p className="trainer-search-empty">No trainers found.</p>
      )}
    </div>
  );
};

export default TrainerSearchBar;
