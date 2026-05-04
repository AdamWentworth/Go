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
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '5%',
  right: '5%',
  width: '30%',
  height: '30%',
  zIndex: 1,
};

const LinkedPokemonGrid: React.FC<LinkedPokemonGridProps> = ({
  title,
  sectionClassName,
  gridClassName,
  containerClassName,
  imageClassName,
  entries,
}) => {
  return (
    <div className={sectionClassName}>
      <h1>{title}</h1>
      <div className={gridClassName}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={containerClassName}
            style={{ position: 'relative' }}
          >
            {entry.dynamax && (
              <img src="/images/dynamax.png" alt="Dynamax" style={badgeStyle} />
            )}

            {entry.gigantamax && (
              <img
                src="/images/gigantamax.png"
                alt="Gigantamax"
                style={badgeStyle}
              />
            )}

            <img
              src={entry.currentImage}
              alt={entry.name}
              className={`${imageClassName} ${entry.match ? 'glowing-pokemon' : ''}`}
              title={`${entry.form ? `${entry.form} ` : ''}${entry.name ?? ''}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LinkedPokemonGrid;
