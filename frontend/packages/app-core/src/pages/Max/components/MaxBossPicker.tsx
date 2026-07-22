import { useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';

import { resolveAssetUrl } from '@/utils/assetUrl';
import type { PokemonVariant } from '@/types/pokemonVariants';

type MaxBossPickerProps = {
  bosses: PokemonVariant[];
  selectedBoss: PokemonVariant;
  onSelect: (boss: PokemonVariant) => void;
};

const MaxBossPicker = ({ bosses, selectedBoss, onSelect }: MaxBossPickerProps) => {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const matches = useMemo(
    () =>
      query
        ? bosses
            .filter((boss) =>
              `${boss.name} ${boss.pokedex_number}`.toLowerCase().includes(query),
            )
            .slice(0, 8)
        : [],
    [bosses, query],
  );

  return (
    <section className="max-boss-picker" aria-label="Max Battle boss">
      <div className="max-selected-boss">
        <div className="max-selected-boss-image">
          <img
            src={resolveAssetUrl(
              selectedBoss.currentImage || selectedBoss.image_url || '',
            )}
            alt=""
          />
        </div>
        <div>
          <span>Max Battle boss</span>
          <h2>{selectedBoss.name}</h2>
          <small>
            {selectedBoss.type1_name}
            {selectedBoss.type2_name ? ` / ${selectedBoss.type2_name}` : ''}
          </small>
        </div>
      </div>
      <div className="max-boss-search-wrap">
        <label className="max-boss-search">
          <FaSearch aria-hidden="true" />
          <input
            aria-label="Search Max Battle bosses"
            autoComplete="off"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Max Battle bosses"
            type="search"
            value={search}
          />
        </label>
        {query && (
          <div className="max-boss-results" role="listbox" aria-label="Boss results">
            {matches.length > 0 ? (
              matches.map((boss) => (
                <button
                  aria-selected={boss.variant_id === selectedBoss.variant_id}
                  key={boss.variant_id}
                  onClick={() => {
                    onSelect(boss);
                    setSearch('');
                  }}
                  role="option"
                  type="button"
                >
                  <img
                    src={resolveAssetUrl(boss.currentImage || boss.image_url || '')}
                    alt=""
                  />
                  <span>{boss.name}</span>
                  <small>#{String(boss.pokedex_number).padStart(4, '0')}</small>
                </button>
              ))
            ) : (
              <p>No matching Max boss found.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default MaxBossPicker;

