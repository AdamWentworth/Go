import React from "react";

import type { PokemonVariant } from "@/types/pokemonVariants";
import { getPokemonImage, isMegaMewtwoY } from "../utils/raidViewModel";

type RaidPokemonImageProps = {
  variant: PokemonVariant;
  alt?: string;
};

const RaidPokemonImage: React.FC<RaidPokemonImageProps> = ({
  variant,
  alt = "",
}) => (
  <img
    className={`raid-pokemon-image${
      isMegaMewtwoY(variant) ? " raid-pokemon-image--mega-mewtwo-y" : ""
    }`}
    src={getPokemonImage(variant)}
    alt={alt}
    draggable={false}
  />
);

export default RaidPokemonImage;
