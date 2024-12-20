// useRegisterForm.js

import { useState, useCallback } from 'react';
import { fetchSuggestions, fetchLocationOptions } from '../../../services/locationServices';

const useRegisterForm = (onSubmit) => {
    const [values, setValues] = useState({
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
  
    const [errors, setErrors] = useState({});
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState(null);
    const [showLocationWarning, setShowLocationWarning] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
    const [locationOptions, setLocationOptions] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false); // Tracks submission attempts

    // Function to validate inputs
    const validate = (values) => {
        let tempErrors = {};
      
        // Validate Username
        const username = values.username.trim();
    
        if (!username) {
            tempErrors.username = "Username is required";
        } else if (/\s/.test(username)) {
            tempErrors.username = "Username cannot contain spaces";
        } else if (!/^[A-Za-z0-9_]{4,15}$/.test(username)) { // Allowing underscores
            tempErrors.username = "Username can only contain letters, numbers, and underscores";
        } else {
            tempErrors.username = "";
        }
      
        // Validate Email
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        tempErrors.email = emailRegex.test(values.email)
          ? ""
          : "Email is not valid";
      
        // Validate Password
        const password = values.password;
        if (!password) {
            tempErrors.password = "Password is required";
        } else if (password.length < 8) {
            tempErrors.password = "Password must be at least 8 characters long";
        } else if (!/[A-Z]/.test(password)) {
            tempErrors.password = "Password must include at least one uppercase letter";
        } else if (!/[a-z]/.test(password)) {
            tempErrors.password = "Password must include at least one lowercase letter";
        } else if (!/\d/.test(password)) {
            tempErrors.password = "Password must include at least one number";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            tempErrors.password = "Password must include at least one special character";
        } else {
            tempErrors.password = "";
        }
      
        // Validate Pokémon GO Name
        const pokemonGoName = values.pokemonGoName.trim();
        if (!values.pokemonGoNameDisabled) { // Only validate if not disabled
            if (pokemonGoName) { // If provided, validate like username
                if (pokemonGoName.length < 4) {
                    tempErrors.pokemonGoName = "Pokémon GO Name must be at least 4 characters long";
                } else if (pokemonGoName.length > 15) {
                    tempErrors.pokemonGoName = "Pokémon GO Name must be at most 15 characters long";
                } else if (/\s/.test(pokemonGoName)) {
                    tempErrors.pokemonGoName = "Pokémon GO Name cannot contain spaces";
                } else if (!/^[A-Za-z0-9_]{4,15}$/.test(pokemonGoName)) { // Allowing underscores
                    tempErrors.pokemonGoName = "Pokémon GO Name can only contain letters, numbers, and underscores";
                } else {
                    tempErrors.pokemonGoName = "";
                }
            } else {
                // Pokémon GO Name is optional; no error if empty
                tempErrors.pokemonGoName = "";
            }
        } else {
            // If disabled, ensure it matches the username (already validated)
            tempErrors.pokemonGoName = "";
        }
      
        // Validate Trainer Code
        const cleanTrainerCode = values.trainerCode.replace(/\s+/g, '');
        if (cleanTrainerCode) { // Only validate if trainer code is provided
            if (cleanTrainerCode.length !== 12) {
                tempErrors.trainerCode = "Trainer code must be exactly 12 digits";
            } else if (!/^\d{12}$/.test(cleanTrainerCode)) {
                tempErrors.trainerCode = "Trainer code must contain only numbers";
            } else {
                tempErrors.trainerCode = "";
            }
        }
      
        return tempErrors;
    };            

    // Input change handler
    const handleInputChange = async (event) => {
        const { name, value, type, checked } = event.target;
        let updatedValues = {
            ...values,
            [name]: type === 'checkbox' ? checked : value
        };
    
        if (name === 'pokemonGoNameDisabled') {
            if (checked) {
                updatedValues.pokemonGoName = updatedValues.username;
            } else {
                updatedValues.pokemonGoName = '';
            }
        } else if (name === 'username' && values.pokemonGoNameDisabled) {
            updatedValues.pokemonGoName = value;
        }
    
        // Format trainer code to display in XXXX XXXX XXXX format as user types
        if (name === 'trainerCode') {
            const cleanValue = value.replace(/\s+/g, '').slice(0, 12);
            updatedValues.trainerCode = cleanValue.replace(/(.{4})/g, '$1 ').trim();
        }

        if (name === 'locationInput') {
            setShowLocationWarning(true);
            setSelectedCoordinates(null);
            updatedValues.coordinates = null;
            updatedValues.allowLocation = false;
    
            if (value.length > 2) {
                const fetchedSuggestions = await fetchSuggestions(value);
                setSuggestions(fetchedSuggestions);
            } else {
                setSuggestions([]);
            }
        }

        // Only validate and show errors if user has already attempted to submit
        if (hasSubmitted) {
            const validationErrors = validate(updatedValues);
            setErrors(validationErrors);
        }

        setValues(updatedValues);
    };

    // Form submission handler
    const handleSubmit = (event) => {
        if (event && event.preventDefault) {
          event.preventDefault();
        }
      
        setHasSubmitted(true); // Mark that user has attempted to submit
        const validationErrors = validate(values);
        setErrors(validationErrors);
        
        // Check if there are any non-empty error messages
        const hasErrors = Object.values(validationErrors).some(error => error !== "");
      
        if (!hasErrors) {
          const submitValues = {
            ...values,
            pokemonGoName: values.pokemonGoNameDisabled ? values.username : values.pokemonGoName,
            location: values.locationInput
          };
      
          onSubmit(submitValues);
        } else {
          console.error("Validation failed:", validationErrors);
        }
    };

    // Expose a method to manually set errors from outside
    const setFormErrors = useCallback((newErrors) => {
        setHasSubmitted(true); // Also set hasSubmitted when external errors are set
        setErrors(prevErrors => ({
            ...prevErrors,
            ...newErrors
        }));
    }, []);

    // Location handlers
    const handleAllowLocationChange = async (e) => {
        const allowLocation = e.target.checked;
    
        setValues((prev) => ({
            ...prev,
            allowLocation,
            coordinates: allowLocation ? null : prev.coordinates,
        }));
    
        if (allowLocation) {
            if (navigator.geolocation) {
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
                        } catch (error) {
                            alert('Unable to fetch location options. Please try again.');
                        }
                    },
                    (error) => {
                        console.error('Error fetching location:', error.message);
                        alert('Unable to fetch your current location. Please enable location permissions.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser.');
            }
        } else {
            setSuggestions([]);
            setSelectedCoordinates(null);
            setShowOptionsOverlay(false);
            setLocationOptions([]);
        }
    };

    const handleCoordinatesSelect = (coordinates) => {
        setSelectedCoordinates(coordinates);
        setValues((prev) => ({ ...prev, coordinates }));
    };

    const handleCheckboxChange = ({ target: { name, checked } }) => {
        setValues((prev) => {
            let updatedValues = { ...prev, [name]: checked };
            
            if (name === 'pokemonGoNameDisabled') {
                if (checked) {
                    updatedValues.pokemonGoName = updatedValues.username;
                } else {
                    updatedValues.pokemonGoName = ''; // Clear the field or allow user to input
                }
            }
    
            return updatedValues;
        });
    };

    const handleLocationInputFocus = () => {
        if (selectedCoordinates) setShowLocationWarning(true);
    };

    const handleLocationInputBlur = () => setShowLocationWarning(false);

    const selectSuggestion = (suggestion) => {
        const { name, city, state_or_province, country } = suggestion;
    
        // Format the location input
        const locationParts = [
            name || city, 
            state_or_province, 
            country
        ].filter(Boolean); // Remove undefined/null values
    
        const formattedLocation = locationParts.join(', ');
    
        setValues((prev) => ({ ...prev, locationInput: formattedLocation }));
        setSuggestions([]); // Clear suggestions
    };  

    const handleLocationUpdate = (location) => {
        const { name, city, state_or_province, country } = location;
    
        const locationParts = [
            name || city, 
            state_or_province, 
            country
        ].filter(Boolean);
    
        const formattedLocation = locationParts.join(', ');
    
        setValues((prev) => ({
            ...prev,
            locationInput: formattedLocation,
        }));
    };

    const handleOverlayLocationSelect = (location) => {
        const { name, city, state_or_province, country } = location;
        const locationParts = [name || city, state_or_province, country].filter(Boolean);
        const formattedLocation = locationParts.join(', ');
    
        setValues((prev) => ({
            ...prev,
            locationInput: formattedLocation,
        }));
    
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
        setErrors: setFormErrors
    };
};

export default useRegisterForm;
