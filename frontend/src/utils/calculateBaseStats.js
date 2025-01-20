// calculateBaseStats.js

export const calculateBaseStats = (pokemon, megaData) => {
    if (megaData.isMega) {
      if (megaData.megaForm) {
        const selectedMega = pokemon.megaEvolutions.find(
          (me) => me.form && me.form.toLowerCase() === megaData.megaForm.toLowerCase()
        );
        if (selectedMega) {
          return {
            attack: Number(selectedMega.attack),
            defense: Number(selectedMega.defense),
            stamina: Number(selectedMega.stamina),
          };
        } else {
          console.warn(
            `Mega form "${megaData.megaForm}" not found in megaEvolutions for Pokémon "${pokemon.name}". Falling back to normal stats.`
          );
        }
      } else {
        const selectedMega = pokemon.megaEvolutions.find(
          (me) => !me.form
        );
        if (selectedMega) {
          return {
            attack: Number(selectedMega.attack),
            defense: Number(selectedMega.defense),
            stamina: Number(selectedMega.stamina),
          };
        } else {
          console.warn(
            `No Mega form with null form found in megaEvolutions for Pokémon "${pokemon.name}". Falling back to normal stats.`
          );
        }
      }
    }
    return {
      attack: Number(pokemon.attack),
      defense: Number(pokemon.defense),
      stamina: Number(pokemon.stamina),
    };
  };
  