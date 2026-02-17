// useAccountForm.ts

import { useState, useEffect, ChangeEvent } from 'react';
import { fetchSuggestions, fetchLocationOptions } from '../../../services/locationServices';
import { createScopedLogger } from '@/utils/logger';

import type { User } from '../../../types/auth';
import type { AccountFormValues, FormErrors } from '@/types/auth';
import type { Coordinates, LocationSuggestion } from '../../../types/location';

const log = createScopedLogger('useAccountForm');

const useAccountForm = (
  user: User,
  handleUpdateUserDetails: (
    userId: string,
    values: Partial<AccountFormValues>,
    toggleEdit: (edit: boolean) => void
  ) => void
) => {
  const [isEditable, setIsEditable] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  const [values, setValues] = useState<AccountFormValues>({
    userId: user.user_id,
    username: user.username,
    email: user.email,
    password: '',
    confirmPassword: '',
    pokemonGoName: user.pokemonGoName || '',
    trainerCode: user.trainerCode ? user.trainerCode.replace(/(\d{4})(?=\d)/g, '$1 ') : '',
    location: user.location || '',
    allowLocation: user.allowLocation || false,
    coordinates: user.coordinates ?? null,
    pokemonGoNameDisabled: user.pokemonGoName === user.username,
    accessTokenExpiry: user.accessTokenExpiry,
    refreshTokenExpiry: user.refreshTokenExpiry,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationSuggestion[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [prevCoordinates, setPrevCoordinates] = useState<Coordinates | null>(
    user.coordinates ?? null
  );

  const resetForm = () => {
    setValues({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      pokemonGoName: user.pokemonGoName || '',
      trainerCode: user.trainerCode ? user.trainerCode.replace(/(\d{4})(?=\d)/g, '$1 ') : '',
      location: user.location || '',
      allowLocation: user.allowLocation || false,
      coordinates: user.coordinates ?? null,
      pokemonGoNameDisabled: user.pokemonGoName === user.username,
      accessTokenExpiry: user.accessTokenExpiry,
      refreshTokenExpiry: user.refreshTokenExpiry,
    });
    setErrors({});
  };

  useEffect(() => {
    if (
      selectedCoordinates &&
      prevCoordinates &&
      (selectedCoordinates.latitude !== prevCoordinates.latitude ||
        selectedCoordinates.longitude !== prevCoordinates.longitude)
    ) {
      setPrevCoordinates(selectedCoordinates);
      log.debug('Coordinates updated:', selectedCoordinates);
    }
  }, [selectedCoordinates, prevCoordinates]);

  useEffect(() => {
    if (!user) {
      alert('No user data available, please log in.');
      log.error('No user data available, please log in.');
    }
  }, [user]);

  const validate = (vals: AccountFormValues): boolean => {
    const tempErrors: FormErrors = {};

    if ('username' in vals) {
      tempErrors.username = vals.username ? '' : 'Username is required.';
    }

    if ('email' in vals) {
      tempErrors.email = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+\.[a-zA-Z]{2,5}$/.test(vals.email)
        ? ''
        : 'Email is not valid.';
    }

    const isPasswordFilled = vals.password.trim() !== '' || vals.confirmPassword.trim() !== '';
    if (isPasswordFilled) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d@#$%^&*!?.]{8,}$/;
      tempErrors.password = passwordRegex.test(vals.password)
        ? ''
        : 'Password must be at least 8 characters long, including 1 uppercase, 1 lowercase, 1 number, 1 special char.';
      tempErrors.confirmPassword =
        vals.confirmPassword === vals.password ? '' : 'Passwords do not match.';
    }

    if ('trainerCode' in vals) {
      const cleanTrainerCode = vals.trainerCode.replace(/\s+/g, '');
      tempErrors.trainerCode =
        cleanTrainerCode.length === 12 && /^\d{12}$/.test(cleanTrainerCode)
          ? ''
          : cleanTrainerCode === ''
          ? ''
          : 'Trainer code must be exactly 12 digits long.';
    }

    if ('location' in vals && vals.allowLocation) {
      tempErrors.location = vals.location ? '' : 'Location is required when enabled.';
    }

    if (vals.allowLocation) {
      const coords = selectedCoordinates || prevCoordinates;
      tempErrors.coordinates = coords ? '' : 'Both coordinates are required.';
    }

    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === '');
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    const updatedValues = {
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    };

    if (name === 'pokemonGoNameDisabled') {
      updatedValues.pokemonGoName = checked ? updatedValues.username : '';
    } else if (name === 'username' && values.pokemonGoNameDisabled) {
      updatedValues.pokemonGoName = value;
    }

    if (name === 'trainerCode') {
      const cleanValue = value.replace(/\s+/g, '').slice(0, 12);
      updatedValues.trainerCode = cleanValue.replace(/(.{4})/g, '$1 ').trim();
    }

    if (name === 'location') {
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

      if (hasSubmitted) {
        validate(updatedValues);
      }
      return;
    }

    if (hasSubmitted) {
      validate(updatedValues);
    }

    setValues(updatedValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    if (validate(values)) {
      onSubmit(values);
    } else {
      log.debug('Validation errors:', errors);
    }
  };

  const onSubmit = (vals: AccountFormValues) => {
    if (isEditable) {
      const submissionValues: Partial<AccountFormValues> = {
        ...vals,
        trainerCode: vals.trainerCode.replace(/\s+/g, ''),
        coordinates: selectedCoordinates ?? prevCoordinates,
      };

      if (vals.password && vals.confirmPassword) {
        submissionValues.password = vals.password;
        submissionValues.confirmPassword = vals.confirmPassword;
      } else {
        delete submissionValues.password;
        delete submissionValues.confirmPassword;
      }

      log.debug('Submitting values:', submissionValues);

      if (!submissionValues.allowLocation) {
        localStorage.removeItem('location');
      }

      handleUpdateUserDetails(user.user_id, submissionValues, setIsEditable);
    }
  };

  const handleEditToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEditable) {
      setValues((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setErrors((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    }
    setIsEditable(!isEditable);
  };

  const handleAllowLocationChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const allowLocation = e.target.checked;

    setValues((prev) => ({
      ...prev,
      allowLocation,
      coordinates: allowLocation ? prev.coordinates : null,
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
            alert('Unable to fetch location options. Please try again.');
          }          
        },
        () => {
          log.error('Error fetching location.');
          alert('Unable to fetch your current location. Please enable location permissions.');
        }
      );
    } else if (allowLocation) {
      alert('Geolocation is not supported by your browser.');
    } else {
      setSuggestions([]);
      setSelectedCoordinates(null);
      setShowOptionsOverlay(false);
      setLocationOptions([]);
    }
  };

  const handleCoordinatesSelect = (coordinates: Coordinates) => {
    setSelectedCoordinates(coordinates);
    setValues((prev) => ({
      ...prev,
      coordinates,
      allowLocation: false,
    }));
  };

  const handleLocationInputFocus = () => setShowLocationWarning(true);
  const handleLocationInputBlur = () => setShowLocationWarning(false);

  const selectSuggestion = (s: LocationSuggestion) => {
    const formatted = [s.name || s.city, s.state_or_province, s.country].filter(Boolean).join(', ');
    setValues((prev) => ({ ...prev, location: formatted }));
    setSuggestions([]);
  };

  const handleLocationUpdate = (loc: LocationSuggestion) => {
    const formatted = [loc.name || loc.city, loc.state_or_province, loc.country].filter(Boolean).join(', ');
    setValues((prev) => ({ ...prev, location: formatted }));
  };

  const handleOverlayLocationSelect = (loc: LocationSuggestion) => {
    const formatted = [loc.name || loc.city, loc.state_or_province, loc.country].filter(Boolean).join(', ');
    setValues((prev) => ({ ...prev, location: formatted }));
    setShowOptionsOverlay(false);
    setLocationOptions([]);
  };

  const clearManualCoordinates = () => {
    setSelectedCoordinates(null);
    setValues((prev) => ({
      ...prev,
      coordinates: null,
      allowLocation: false,
    }));
  };

  useEffect(() => {
    if (!isEditable) {
      setValues((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setErrors((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    }
  }, [isEditable]);

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    isEditable,
    handleEditToggle,
    isMapVisible,
    setIsMapVisible,
    showOptionsOverlay,
    setShowOptionsOverlay,
    selectedCoordinates,
    prevCoordinates,
    handleCoordinatesSelect,
    handleLocationUpdate,
    handleOverlayLocationSelect,
    handleAllowLocationChange,
    handleLocationInputFocus,
    handleLocationInputBlur,
    suggestions,
    selectSuggestion,
    locationOptions,
    showLocationWarning,
    setErrors,
    clearManualCoordinates,
    resetForm,
  };
};

export default useAccountForm;
