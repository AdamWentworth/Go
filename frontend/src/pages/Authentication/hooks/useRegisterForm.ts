// useRegisterForm.ts

import { useState, useCallback, ChangeEvent, FocusEvent } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { fetchSuggestions, fetchLocationOptions } from '../../../services/locationServices';
import type { Coordinates, LocationSuggestion } from '../../../types/location';
import type { RegisterFormValues, RegisterFormErrors } from '../../../types/auth';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useRegisterForm');

const useRegisterForm = (
  onSubmit: (values: RegisterFormValues & { location: string }) => void
) => {
  const { alert } = useModal();
  const [values, setValues] = useState<RegisterFormValues>({
    username: '',
    email: '',
    password: '',
    trainerCode: '',
    pokemonGoName: '',
    locationInput: '',
    coordinates: null,
    allowLocation: false,
    pokemonGoNameDisabled: false,
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isMapVisible, setIsMapVisible] = useState<boolean>(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [showLocationWarning, setShowLocationWarning] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showOptionsOverlay, setShowOptionsOverlay] = useState<boolean>(false);
  const [locationOptions, setLocationOptions] = useState<LocationSuggestion[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  const validate = (values: RegisterFormValues): RegisterFormErrors => {
    const tempErrors: RegisterFormErrors = {};
    const username = values.username.trim();

    if (!username) {
      tempErrors.username = 'Username is required';
    } else if (/\s/.test(username)) {
      tempErrors.username = 'Username cannot contain spaces';
    } else if (!/^[A-Za-z0-9_]{3,15}$/.test(username)) {
      tempErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else {
      tempErrors.username = '';
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    tempErrors.email = emailRegex.test(values.email) ? '' : 'Email is not valid';

    const password = values.password;
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(password)) {
      tempErrors.password = 'Password must include at least one uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      tempErrors.password = 'Password must include at least one lowercase letter';
    } else if (!/\d/.test(password)) {
      tempErrors.password = 'Password must include at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      tempErrors.password = 'Password must include at least one special character';
    } else {
      tempErrors.password = '';
    }

    const pokemonGoName = values.pokemonGoName.trim();
    if (!values.pokemonGoNameDisabled) {
      if (pokemonGoName) {
        if (pokemonGoName.length < 3) {
          tempErrors.pokemonGoName = 'Pokémon GO Name must be at least 3 characters long';
        } else if (pokemonGoName.length > 15) {
          tempErrors.pokemonGoName = 'Pokémon GO Name must be at most 15 characters long';
        } else if (/\s/.test(pokemonGoName)) {
          tempErrors.pokemonGoName = 'Pokémon GO Name cannot contain spaces';
        } else if (!/^[A-Za-z0-9_]{4,15}$/.test(pokemonGoName)) {
          tempErrors.pokemonGoName = 'Pokémon GO Name can only contain letters, numbers, and underscores';
        } else {
          tempErrors.pokemonGoName = '';
        }
      } else {
        tempErrors.pokemonGoName = '';
      }
    } else {
      tempErrors.pokemonGoName = '';
    }

    const cleanTrainerCode = values.trainerCode.replace(/\s+/g, '');
    if (cleanTrainerCode) {
      if (cleanTrainerCode.length !== 12) {
        tempErrors.trainerCode = 'Trainer code must be exactly 12 digits';
      } else if (!/^\d{12}$/.test(cleanTrainerCode)) {
        tempErrors.trainerCode = 'Trainer code must contain only numbers';
      } else {
        tempErrors.trainerCode = '';
      }
    }

    return tempErrors;
  };

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    // Trim username input
    const newValue = name === 'username' ? value.trim() : value;

    const updatedValues: RegisterFormValues = {
      ...values,
      [name]: type === 'checkbox' ? checked : newValue,
    };

    if (name === 'pokemonGoNameDisabled') {
      updatedValues.pokemonGoName = checked ? updatedValues.username : '';
    } else if (name === 'username' && values.pokemonGoNameDisabled) {
      updatedValues.pokemonGoName = newValue;
    }

    if (name === 'trainerCode') {
      const cleanValue = value.replace(/\s+/g, '').slice(0, 12);
      updatedValues.trainerCode = cleanValue.replace(/(.{4})/g, '$1 ').trim();
    }

    if (name === 'locationInput') {
      setShowLocationWarning(true);
      setSelectedCoordinates(null);
      updatedValues.coordinates = null;
      updatedValues.allowLocation = false;
      setValues(updatedValues);

      if (value.length > 2) {
        const fetchedSuggestions = await fetchSuggestions(value);
        setSuggestions(fetchedSuggestions);
      } else {
        setSuggestions([]);
      }
    } else {
      setValues(updatedValues);
    }

    if (hasSubmitted) {
      const validationErrors = validate(updatedValues);
      setErrors(validationErrors);
    }
  };

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    setHasSubmitted(true);
    const validationErrors = validate(values);
    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some((error) => error !== '');

    if (!hasErrors) {
      // Combine the values with a new key for the submitted location.
      const submitValues = {
        ...values,
        pokemonGoName: values.pokemonGoNameDisabled ? values.username : values.pokemonGoName,
        location: values.locationInput,
      };
      onSubmit(submitValues);
    } else {
      log.debug('Validation failed:', validationErrors);
    }
  };

  const setFormErrors = useCallback((newErrors: RegisterFormErrors) => {
    setHasSubmitted(true);
    setErrors((prevErrors) => ({
      ...prevErrors,
      ...newErrors,
    }));
  }, []);

  const handleAllowLocationChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const allowLocation = e.target.checked;

    setValues((prev) => ({
      ...prev,
      allowLocation,
      coordinates: allowLocation ? null : prev.coordinates,
    }));

    if (allowLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedCoordinates({ latitude, longitude });
          setValues((prev) => ({
            ...prev,
            coordinates: { latitude, longitude },
          }));

          try {
            const fetchedOptions = await fetchLocationOptions(latitude, longitude);
            setLocationOptions(fetchedOptions);
            setShowOptionsOverlay(true);
          } catch {
            await alert('Unable to fetch location options. Please try again.');
          }
        },
        (err) => {
          log.error('Error fetching location:', err.message);
          void alert('Unable to fetch your current location. Please enable location permissions.');
        }
      );
    } else if (allowLocation) {
      void alert('Geolocation is not supported by your browser.');
    } else {
      setSuggestions([]);
      setSelectedCoordinates(null);
      setShowOptionsOverlay(false);
      setLocationOptions([]);
    }
  };

  const handleCoordinatesSelect = (coordinates: Coordinates) => {
    setSelectedCoordinates(coordinates);
    setValues((prev) => ({ ...prev, coordinates }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setValues((prev) => {
      const updated = { ...prev, [name]: checked };
      if (name === 'pokemonGoNameDisabled') {
        updated.pokemonGoName = checked ? prev.username : '';
      }
      return updated;
    });
  };

  const handleLocationInputFocus = () => {
    if (selectedCoordinates) setShowLocationWarning(true);
  };

  const handleLocationInputBlur = (_e: FocusEvent<HTMLInputElement>) => {
    setShowLocationWarning(false);
  };

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    const { name, city, state_or_province, country } = suggestion;
    const parts = [name || city, state_or_province, country].filter(Boolean);
    setValues((prev) => ({ ...prev, locationInput: parts.join(', ') }));
    setSuggestions([]);
  };

  const handleLocationUpdate = (location: LocationSuggestion) => {
    const parts = [location.name || location.city, location.state_or_province, location.country].filter(Boolean);
    setValues((prev) => ({ ...prev, locationInput: parts.join(', ') }));
  };

  const handleOverlayLocationSelect = (location: LocationSuggestion) => {
    const parts = [location.name || location.city, location.state_or_province, location.country].filter(Boolean);
    setValues((prev) => ({ ...prev, locationInput: parts.join(', ') }));
    setShowOptionsOverlay(false);
    setLocationOptions([]);
  };

  return {
    values,
    errors,
    handleSubmit,
    handleInputChange,
    handleCheckboxChange,
    handleAllowLocationChange,
    handleCoordinatesSelect,
    handleLocationInputFocus,
    handleLocationInputBlur,
    selectSuggestion,
    handleLocationUpdate,
    handleOverlayLocationSelect,
    isMapVisible,
    setIsMapVisible,
    selectedCoordinates,
    showLocationWarning,
    suggestions,
    showOptionsOverlay,
    setShowOptionsOverlay,
    locationOptions,
    setErrors: setFormErrors,
  };
};

export default useRegisterForm;
