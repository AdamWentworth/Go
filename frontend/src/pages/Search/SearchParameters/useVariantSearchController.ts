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
  type SortableCostume,
} from './variantSearchHelpers';
import {
  buildVariantValidationState,
  evaluatePokemonInputChange,
  EMPTY_SELECTED_MOVES,
  runVariantValidation,
  type VariantValidationState,
} from './variantSearchControllerHelpers';
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
  const validationState: VariantValidationState = {
    name: pokemon,
    shinyChecked: isShiny,
    shadowChecked: isShadow,
    selectedCostume: costume,
    form: selectedForm,
    selectedGenderValue: selectedGender,
    dynamaxEnabled: dynamax,
    gigantamaxEnabled: gigantamax,
  };

  const handleValidation = (overrides: Partial<VariantValidationState> = {}) => {
    const nextState = buildVariantValidationState(validationState, overrides);
    const result = runVariantValidation({
      pokemonData,
      state: nextState,
      validatePokemonFn: validatePokemon,
      updateImageFn: updateImage,
    });

    if (result.error) {
      handleError(result.error);
      setErrorMessage(result.error);
    } else {
      clearError();
      setErrorMessage(null);
    }

    setAvailableCostumes(result.availableCostumes);
    setAvailableForms(result.availableForms);

    if (!result.error) {
      setImageUrl(result.imageUrl ?? null);
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
      handleValidationRef.current();
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
    const inputDecision = evaluatePokemonInputChange({
      nextPokemon: newPokemon,
      pokemonData,
    });
    if (inputDecision.shouldIgnore) return;

    setPokemon(newPokemon);
    setSelectedForm('');
    setSelectedGender('Any');
    setSelectedMoves(EMPTY_SELECTED_MOVES);
    setDynamax(false);
    setGigantamax(false);

    setSuggestions(inputDecision.suggestions);
    if (inputDecision.shouldResetDerivedState) {
      setImageUrl(null);
      setAvailableForms([]);
      setAvailableCostumes([]);
      setCostume(null);
      setSelectedBackground(null);
      return;
    }

    handleValidation({
      name: newPokemon,
      form: '',
    });
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
    handleValidation({ shinyChecked });
  };

  const handleShadowChange = () => {
    const shadowChecked = !isShadow;
    setIsShadow(shadowChecked);
    handleValidation({ shadowChecked });
  };

  const handleCostumeToggle = () => {
    const nextShow = !showCostumeDropdown;
    setShowCostumeDropdown(nextShow);

    if (!nextShow) {
      setCostume(null);
      clearError();
      handleValidation({ selectedCostume: '' });
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
    handleValidation({ selectedCostume });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextForm = event.target.value;
    setSelectedForm(nextForm);
    handleValidation({ form: nextForm });
  };

  const handleMovesChange = (moves: SelectedMoves) => {
    setSelectedMoves(moves);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPokemon(suggestion);
    setSuggestions([]);
    handleValidation({ name: suggestion });
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
