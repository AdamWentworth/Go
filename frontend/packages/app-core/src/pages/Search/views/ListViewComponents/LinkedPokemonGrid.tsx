import React from 'react';

export type LinkedPokemonGridEntry = {
  id: string;
  currentImage?: string;
  name?: string;
  form?: string | null;
  dynamax?: boolean;
  gigantamax?: boolean;
  match?: boolean;
};

type LinkedPokemonGridProps = {
  title: string;
  sectionClassName: string;
  gridClassName: string;
  containerClassName: string;
  imageClassName: string;
  entries: LinkedPokemonGridEntry[];
  maxVisible?: number;
};

const LinkedPokemonGrid: React.FC<LinkedPokemonGridProps> = ({
  title,
  sectionClassName,
  gridClassName,
  containerClassName,
  imageClassName,
  entries,
  maxVisible = 3,
}) => {
  const visibleEntries = entries.slice(0, maxVisible);
  const remainingCount = Math.max(0, entries.length - visibleEntries.length);

  return (
    <div className={sectionClassName}>
      <header className="linked-pokemon-grid__header">
        <div>
          <span>Trade compatibility</span>
          <h4>{title}</h4>
        </div>
        <strong>{entries.length}</strong>
      </header>
      <div className={`${gridClassName} linked-pokemon-grid`}>
        {visibleEntries.map((entry) => (
          <div
            key={entry.id}
            className={`${containerClassName} linked-pokemon-grid__item`}
          >
            {entry.dynamax && (
              <img
                src="/images/dynamax.png"
                alt="Dynamax"
                className="linked-pokemon-grid__max-badge"
              />
            )}

            {entry.gigantamax && (
              <img
                src="/images/gigantamax.png"
                alt="Gigantamax"
                className="linked-pokemon-grid__max-badge"
              />
            )}

            <img
              src={entry.currentImage}
              alt={entry.name || 'Pokémon'}
              className={`${imageClassName} ${entry.match ? 'glowing-pokemon' : ''}`}
              title={`${entry.form ? `${entry.form} ` : ''}${entry.name ?? ''}`}
            />
            <span>{entry.name || 'Unknown Pokémon'}</span>
            {entry.match ? <small>Mutual match</small> : null}
          </div>
        ))}
      </div>
      {remainingCount > 0 ? (
        <p className="linked-pokemon-grid__remaining">
          +{remainingCount} more in this trainer&apos;s listing
        </p>
      ) : null}
    </div>
  );
};

export default LinkedPokemonGrid;
