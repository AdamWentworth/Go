import React from 'react';

export type MapPopupLinkedEntry = {
  match?: boolean;
  form?: string;
  name?: string;
  [key: string]: unknown;
};

type MatchedPokemon = {
  currentImage?: string;
  name?: string;
  form?: string | null;
};

type MapPopupLinkedPokemonListProps = {
  title: string;
  sectionClassName: string;
  listClassName: string;
  imageClassName: string;
  entries?: Record<string, MapPopupLinkedEntry> | null;
  findPokemonByKey: (
    keyOrInstanceId?: string | null,
    instanceLike?: Record<string, unknown> | null,
  ) => MatchedPokemon | null;
};

const MapPopupLinkedPokemonList: React.FC<MapPopupLinkedPokemonListProps> = ({
  title,
  sectionClassName,
  listClassName,
  imageClassName,
  entries,
  findPokemonByKey,
}) => {
  if (!entries) return null;

  return (
    <div className={sectionClassName}>
      <h3>{title}</h3>
      <div className={listClassName}>
        {Object.keys(entries).map((entryId) => {
          const entry = entries[entryId];
          const matchedPokemon = findPokemonByKey(entryId, entry ?? null);

          return matchedPokemon ? (
            <img
              key={entryId}
              src={matchedPokemon.currentImage}
              alt={matchedPokemon.name}
              className={`${imageClassName} ${entry?.match ? 'glowing-pokemon' : ''}`}
              title={`${matchedPokemon.form ? `${matchedPokemon.form} ` : ''}${matchedPokemon.name ?? ''}`}
            />
          ) : (
            <p key={entryId}>No match found</p>
          );
        })}
      </div>
    </div>
  );
};

export default MapPopupLinkedPokemonList;
