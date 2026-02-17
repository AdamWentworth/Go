import { useEffect, useRef, useState } from 'react';

import validatePokemon from '../utils/validatePokemon';
import { updateImage } from '../utils/updateImage';
import useErrorHandler from '../hooks/useErrorHandler';
import {
  computeMaxAvailability,
  cycleMaxState,
  getPokemonSuggestions,
  getSelectedCostumeId,
  isBackgroundAllowedForSelection,
  normalizeAvailableForms,
  sortCostumesByDate,
  type SortableCostume,
} from './variantSearchHelpers';
import type { BackgroundSelection } from './VariantSearchBackgroundOverlay';
import type { SelectedMoves } from './VariantComponents/MovesSearch';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface UseVariantSearchControllerArgs {
  pokemon: string;
  setPokemon: React.Dispatch<React.SetStateAction<string>>;
  isShiny: boolean;
  setIsShiny: React.Dispatch<React.SetStateAction<boolean>>;
  isShadow: boolean;
  setIsShadow: React.Dispatch<React.SetStateAction<boolean>>;
  costume: string | null;
  setCostume: React.Dispatch<React.SetStateAction<string | null>>;
  selectedForm: string;
  setSelectedForm: React.Dispatch<React.SetStateAction<string>>;
  selectedMoves: SelectedMoves;
  setSelectedMoves: React.Dispatch<React.SetStateAction<SelectedMoves>>;
  selectedGender: string | null;
  setSelectedGender: React.Dispatch<React.SetStateAction<string | null>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedBackgroundId: React.Dispatch<React.SetStateAction<number | null>>;
  dynamax: boolean;
  setDynamax: React.Dispatch<React.SetStateAction<boolean>>;
  gigantamax: boolean;
  setGigantamax: React.Dispatch<React.SetStateAction<boolean>>;
  pokemonCache: PokemonVariant[] | null;
}

interface UseVariantSearchControllerResult {
  currentPokemonData: PokemonVariant | undefined;
  availableForms: string[];
  availableCostumes: SortableCostume[];
  imageUrl: string | null;
  imageError: boolean;
  showCostumeDropdown: boolean;
  selectedBackground: BackgroundSelection | null;
  showBackgroundOverlay: boolean;
  suggestions: string[];
  backgroundAllowed: boolean;
  selectedCostumeId: number | undefined;
  canDynamax: boolean;
  toggleMax: () => void;
  setShowBackgroundOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  handleImageError: () => void;
  handleBackgroundChange: (background: BackgroundSelection | null) => void;
  handleGenderChange: (gender: string | null) => void;
  handlePokemonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
  handleShinyChange: () => void;
  handleShadowChange: () => void;
  handleCostumeToggle: () => void;
  handleCostumeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleFormChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleMovesChange: (moves: SelectedMoves) => void;
  handleSuggestionClick: (suggestion: string) => void;
}

const useVariantSearchController = ({
  pokemon,
  setPokemon,
  isShiny,
  setIsShiny,
  isShadow,
  setIsShadow,
  costume,
  setCostume,
  selectedForm,
  setSelectedForm,
  selectedMoves: _selectedMoves,
  setSelectedMoves,
  selectedGender,
  setSelectedGender,
  setErrorMessage,
  setSelectedBackgroundId,
  dynamax,
  setDynamax,
  gigantamax,
  setGigantamax,
  pokemonCache,
}: UseVariantSearchControllerArgs): UseVariantSearchControllerResult => {
  const { handleError, clearError } = useErrorHandler<string>();
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [availableCostumes, setAvailableCostumes] = useState<SortableCostume[]>([]);
  const [pokemonData, setPokemonData] = useState<PokemonVariant[]>(pokemonCache || []);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false);
  const [selectedBackground, setSelectedBackground] =
    useState<BackgroundSelection | null>(null);
  const [showBackgroundOverlay, setShowBackgroundOverlay] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setPokemonData(pokemonCache || []);
  }, [pokemonCache]);

  const currentPokemonData = pokemonData.find(
    (entry) => entry.name.toLowerCase() === (pokemon || '').toLowerCase(),
  );
  const { hasDynamax, hasGigantamax } = computeMaxAvailability(currentPokemonData);
  const backgroundAllowed = isBackgroundAllowedForSelection(
    currentPokemonData,
    costume,
    availableCostumes,
  );
  const selectedCostumeId = getSelectedCostumeId(availableCostumes, costume);
  const canDynamax = hasDynamax || hasGigantamax;

  const handleValidation = (
    name: string,
    shinyChecked: boolean,
    shadowChecked: boolean,
    selectedCostume: string | null,
    form: string,
    selectedGenderValue: string | null,
    dynamaxEnabled: boolean,
    gigantamaxEnabled: boolean,
  ) => {
    const {
      error,
      availableCostumes: validatedCostumes,
      availableForms: validatedForms,
    } = validatePokemon(
      pokemonData as unknown as Parameters<typeof validatePokemon>[0],
      name,
      shinyChecked,
      shadowChecked,
      selectedCostume,
      form,
      dynamaxEnabled,
      gigantamaxEnabled,
    );

    if (error) {
      handleError(error);
      setErrorMessage(error);
    } else {
      clearError();
      setErrorMessage(null);
    }

    const sortedCostumes = sortCostumesByDate(
      validatedCostumes as unknown as SortableCostume[],
    );
    setAvailableCostumes(sortedCostumes);

    const filteredForms = normalizeAvailableForms(validatedForms);
    setAvailableForms(filteredForms);

    if (!error) {
      const nextImageUrl = updateImage(
        pokemonData,
        name,
        shinyChecked,
        shadowChecked,
        selectedCostume,
        form,
        selectedGenderValue,
        gigantamaxEnabled,
      );
      setImageUrl(nextImageUrl);
      setImageError(false);
    }
  };

  const handleValidationRef = useRef(handleValidation);
  handleValidationRef.current = handleValidation;

  const toggleMax = () => {
    const next = cycleMaxState({
      dynamax,
      gigantamax,
      hasDynamax,
      hasGigantamax,
    });

    if (next.dynamax !== dynamax) {
      setDynamax(next.dynamax);
    }
    if (next.gigantamax !== gigantamax) {
      setGigantamax(next.gigantamax);
    }
  };

  const handleGenderChange = (gender: string | null) => {
    setSelectedGender(gender);
  };

  useEffect(() => {
    if (pokemon) {
      handleValidationRef.current(
        pokemon,
        isShiny,
        isShadow,
        costume,
        selectedForm,
        selectedGender,
        dynamax,
        gigantamax,
      );
    }
  }, [
    costume,
    dynamax,
    gigantamax,
    isShadow,
    isShiny,
    pokemon,
    selectedForm,
    selectedGender,
  ]);

  const handleBackgroundChange = (background: BackgroundSelection | null) => {
    setSelectedBackground(background);
    setSelectedBackgroundId(background ? background.background_id : null);
    setShowBackgroundOverlay(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePokemonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPokemon = event.target.value;

    if (newPokemon.length > 11) {
      return;
    }

    setPokemon(newPokemon);
    setSelectedForm('');
    setSelectedGender('Any');
    setSelectedMoves({
      fastMove: null,
      chargedMove1: null,
      chargedMove2: null,
    });
    setDynamax(false);
    setGigantamax(false);

    if (newPokemon.length >= 3) {
      const filtered = getPokemonSuggestions(pokemonData, newPokemon);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }

    if (newPokemon.trim() === '') {
      setImageUrl(null);
      setAvailableForms([]);
      setAvailableCostumes([]);
      setCostume(null);
      setSelectedBackground(null);
      return;
    }

    handleValidation(
      newPokemon,
      isShiny,
      isShadow,
      costume,
      '',
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleInputFocus = () => {
    if (!pokemon || pokemon.length < 3) {
      return;
    }

    const filtered = getPokemonSuggestions(pokemonData, pokemon);
    setSuggestions(filtered);
  };

  const handleInputBlur = () => {
    setSuggestions([]);
  };

  const handleShinyChange = () => {
    const shinyChecked = !isShiny;
    setIsShiny(shinyChecked);
    handleValidation(
      pokemon,
      shinyChecked,
      isShadow,
      costume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleShadowChange = () => {
    const shadowChecked = !isShadow;
    setIsShadow(shadowChecked);
    handleValidation(
      pokemon,
      isShiny,
      shadowChecked,
      costume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleCostumeToggle = () => {
    const nextShow = !showCostumeDropdown;
    setShowCostumeDropdown(nextShow);

    if (!nextShow) {
      setCostume(null);
      clearError();
      handleValidation(
        pokemon,
        isShiny,
        isShadow,
        '',
        selectedForm,
        selectedGender,
        dynamax,
        gigantamax,
      );
      const defaultImage = updateImage(
        pokemonData,
        pokemon,
        isShiny,
        isShadow,
        '',
        selectedForm,
        selectedGender,
        dynamax,
      );
      setImageUrl(defaultImage);
      setImageError(false);
    }
  };

  const handleCostumeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCostume = event.target.value;
    setCostume(selectedCostume);
    handleValidation(
      pokemon,
      isShiny,
      isShadow,
      selectedCostume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextForm = event.target.value;
    setSelectedForm(nextForm);
    handleValidation(
      pokemon,
      isShiny,
      isShadow,
      costume,
      nextForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleMovesChange = (moves: SelectedMoves) => {
    setSelectedMoves(moves);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPokemon(suggestion);
    setSuggestions([]);
    handleValidation(
      suggestion,
      isShiny,
      isShadow,
      costume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  return {
    currentPokemonData,
    availableForms,
    availableCostumes,
    imageUrl,
    imageError,
    showCostumeDropdown,
    selectedBackground,
    showBackgroundOverlay,
    suggestions,
    backgroundAllowed,
    selectedCostumeId,
    canDynamax,
    toggleMax,
    setShowBackgroundOverlay,
    handleImageError,
    handleBackgroundChange,
    handleGenderChange,
    handlePokemonChange,
    handleInputFocus,
    handleInputBlur,
    handleShinyChange,
    handleShadowChange,
    handleCostumeToggle,
    handleCostumeChange,
    handleFormChange,
    handleMovesChange,
    handleSuggestionClick,
  };
};

export default useVariantSearchController;
