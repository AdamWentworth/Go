// useRegisterForm.js

import { useState, useCallback } from 'react';
import { fetchSuggestions } from '../../../services/locationServices';
import { fetchLocationOptions } from '../../../services/locationServices';

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

    // Function to validate inputs
    const validate = (values) => {
        let tempErrors = {};
    
        // Validate Username
        tempErrors.username = values.username ? "" : "Username is required.";
    
        // Validate Email
        tempErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
            ? ""
            : "Email is not valid.";
    
        // Validate Password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d@#$%^&*!?.]{8,}$/;
        tempErrors.password = passwordRegex.test(values.password)
            ? ""
            : "Password must be 8 characters long. 1 Uppercase, 1 lowercase, 1 number and 1 special character minimum";
    
        // Validate Trainer Code
        const cleanTrainerCode = values.trainerCode.replace(/\s+/g, '');
        tempErrors.trainerCode =
            cleanTrainerCode.length === 12 && /^\d{12}$/.test(cleanTrainerCode) 
                ? "" 
                : "Trainer code must be exactly 12 digits long.";
    
        // Update Errors State
        setErrors(tempErrors);
    
        // Return true only if all errors are cleared
        return Object.values(tempErrors).every((error) => error === "");
    }; 

    // Input change handler
    const handleInputChange = async (event) => {
        const { name, value, type, checked } = event.target;
        let updatedValues = {
            ...values,
            [name]: type === 'checkbox' ? checked : value
        };
    
        // Sync Pokémon GO name with username if checkbox is checked
        if (name === 'pokemonGoNameDisabled') {
            if (checked) {
                updatedValues.pokemonGoName = updatedValues.username;
            } else {
                updatedValues.pokemonGoName = ''; // Clear or allow user input
            }
        } else if (name === 'username' && values.pokemonGoNameDisabled) {
            // If username changes and pokemonGoNameDisabled is true, update pokemonGoName
            updatedValues.pokemonGoName = value;
        }
    
        // Format trainer code to display in XXXX XXXX XXXX format as user types
        if (name === 'trainerCode' && value.replace(/\s+/g, '').length <= 12) {
            updatedValues.trainerCode = value.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
        }

        // Special handling for location input
        if (name === 'locationInput') {
            // Show the warning when the location input is modified
            setShowLocationWarning(true);
    
            // Clear selected coordinates and uncheck the "allowLocation" checkbox
            setSelectedCoordinates(null);
            updatedValues.coordinates = null;
            updatedValues.allowLocation = false;
    
            // Fetch location suggestions if the input value length > 2
            if (value.length > 2) {
                const fetchedSuggestions = await fetchSuggestions(value);
                setSuggestions(fetchedSuggestions);
            } else {
                setSuggestions([]); // Clear suggestions if input is too short
            }
        }

        setValues(updatedValues);
    };

    // Form submission handler
    const handleSubmit = (event) => {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
    
        if (validate(values)) {
            setErrors({});
            
            // Enforce pokemonGoName synchronization
            const submitValues = {
                ...values,
                pokemonGoName: values.pokemonGoNameDisabled ? values.username : values.pokemonGoName,
                location: values.locationInput // Map locationInput to location
            };
    
            onSubmit(submitValues); // Pass the modified values to onSubmit
        } else {
            console.error("Validation failed:", errors);
        }
    };

    // Expose a method to manually set errors from outside
    const setFormErrors = useCallback((newErrors) => {
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
