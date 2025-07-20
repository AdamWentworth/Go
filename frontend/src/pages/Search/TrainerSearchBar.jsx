import React, { useState, useEffect } from 'react';
import './TrainerSearchBar.css'; // Import the dark mode CSS

const TrainerSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchMockedTrainers(query); // <-- use mock for now
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchMockedTrainers = (searchTerm) => {
    setIsSearching(true);
    setError('');

    try {
      // Mocked static results
      const mockResults = [
        { id: 1, username: 'AshKetchum' },
        { id: 2, username: 'MistyWaterflower' },
        { id: 3, username: 'BrockTheRock' },
        { id: 4, username: 'GaryOak' },
        { id: 5, username: 'ProfessorOak' }
      ];

      setResults(mockResults); // Always return these for now
    } catch (err) {
      console.error('Mock error:', err);
      setError('Failed to fetch trainers');
      setResults([]); // Ensure it's always an array
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="trainer-search-container">
      <p className="trainer-search-heading">Search Trainers</p>

      <input
        type="text"
        placeholder="Start typing a trainer's name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="trainer-search-input"
      />

      {isSearching && <p className="trainer-search-status">Searching...</p>}
      {error && <p className="trainer-search-error">{error}</p>}

      {Array.isArray(results) && results.length > 0 && (
        <ul className="trainer-results">
          {results.map((trainer, index) => (
            <li key={trainer.id || index} className="trainer-result-item">
              {trainer.username}
            </li>
          ))}
        </ul>
      )}

      {!isSearching && query && Array.isArray(results) && results.length === 0 && (
        <p className="trainer-search-empty">No trainers found.</p>
      )}
    </div>
  );
};

export default TrainerSearchBar;
