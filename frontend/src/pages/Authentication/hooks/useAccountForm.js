// useAccountForm.js

import { useState, useEffect } from 'react';
import { fetchSuggestions, fetchLocationOptions } from '../../../services/locationServices'; // Ensure correct path

const useAccountForm = (user, handleUpdateUserDetails) => {
    // State variables for form editability and UI controls
    const [isEditable, setIsEditable] = useState(false);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState(null);
    const [showLocationWarning, setShowLocationWarning] = useState(false); // Controlled by focus

    // Form state variables
    const [values, setValues] = useState({
        userId: user.user_id,
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        pokemonGoName: user.pokemonGoName || '',
        trainerCode: user.trainerCode ? user.trainerCode.replace(/(\d{4})(?=\d)/g, "$1 ") : '',
        location: user.location || '',
        allowLocation: user.allowLocation || false,
        coordinates: user.coordinates || { latitude: '', longitude: '' },
        pokemonGoNameDisabled: user.pokemonGoName === user.username,
        accessTokenExpiry: user.accessTokenExpiry,
        refreshTokenExpiry: user.refreshTokenExpiry
    });

    const [errors, setErrors] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false); // Tracks submission attempts
    const [prevCoordinates, setPrevCoordinates] = useState(user?.coordinates || { latitude: '', longitude: '' });

    const resetForm = () => {
        setValues({
            userId: user.user_id,
            username: user.username,
            email: user.email,
            password: '',
            confirmPassword: '',
            pokemonGoName: user.pokemonGoName || '',
            trainerCode: user.trainerCode ? user.trainerCode.replace(/(\d{4})(?=\d)/g, "$1 ") : '',
            location: user.location || '',
            allowLocation: user.allowLocation || false,
            coordinates: user.coordinates || { latitude: '', longitude: '' },
            pokemonGoNameDisabled: user.pokemonGoName === user.username,
            accessTokenExpiry: user.accessTokenExpiry,
            refreshTokenExpiry: user.refreshTokenExpiry
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
            // Update the previous coordinates to the new ones
            setPrevCoordinates(selectedCoordinates);
    
            // Optionally, you can also trigger additional actions here if needed
            console.log('Coordinates updated:', selectedCoordinates);
        }
    }, [selectedCoordinates, prevCoordinates]);    
 
    // Effect to alert if no user data is available
    useEffect(() => {
        if (!user) {
            alert("No user data available, please log in.");
            console.error("No user data available, please log in.");
        }
    }, [user]);

    // Validation function
    const validate = (vals) => {
        let tempErrors = {};

        // Username Validation
        if ('username' in vals) {
            tempErrors.username = vals.username ? "" : "Username is required.";
        }

        // Email Validation
        if ('email' in vals) {
            tempErrors.email = (/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(vals.email)) ? "" : "Email is not valid.";
        }

        // Password Validation (Only if password fields are filled)
        const isPasswordFilled = vals.password.trim() !== '' || vals.confirmPassword.trim() !== '';
        if (isPasswordFilled) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d@#$%^&*!?.]{8,}$/;
            tempErrors.password = passwordRegex.test(vals.password) ? "" : "Password must be at least 8 characters long, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";

            tempErrors.confirmPassword = vals.confirmPassword === vals.password ? "" : "Passwords do not match.";
        }

        // Trainer Code Validation
        if ('trainerCode' in vals) {
            const cleanTrainerCode = vals.trainerCode.replace(/\s+/g, ''); // Remove any spaces for validation
            tempErrors.trainerCode = (cleanTrainerCode.length === 12 && /^\d{12}$/.test(cleanTrainerCode)) || cleanTrainerCode === "" ? "" : "Trainer code must be exactly 12 digits long.";
        }

        // Location Validation
        if ('location' in vals && vals.allowLocation) { // Updated from 'locationInput' to 'location'
            tempErrors.location = vals.location ? "" : "Location is required when location tracking is enabled.";
        }

        // Coordinates Validation
        if ('coordinates' in vals && vals.allowLocation) {
            // Use selectedCoordinates or fallback to prevCoordinates
            const currentCoordinates = selectedCoordinates || prevCoordinates;

            // Check if currentCoordinates exist and are valid
            if (currentCoordinates) {
                const { latitude, longitude } = currentCoordinates;
                tempErrors.coordinates = (latitude && longitude) ? "" : "Both latitude and longitude are required.";
            } else {
                tempErrors.coordinates = ""; // No error if coordinates are not provided
            }
        }

        setErrors(tempErrors);
        return Object.values(tempErrors).every(x => x === "");
    };    
 
    // Handle input changes
    const handleChange = async (event) => {
        const { name, value, type, checked } = event.target;
        let updatedValues = {
            ...values,
            [name]: type === 'checkbox' ? checked : value
        };
    
        // Handle Pokémon GO name checkbox
        if (name === 'pokemonGoNameDisabled') {
            if (checked) {
                updatedValues.pokemonGoName = updatedValues.username;
            } else {
                updatedValues.pokemonGoName = '';
            }
        } else if (name === 'username' && values.pokemonGoNameDisabled) {
            updatedValues.pokemonGoName = value;
        }
    
        // Format Trainer Code input
        if (name === 'trainerCode') {
            const cleanValue = value.replace(/\s+/g, '').slice(0, 12);
            updatedValues.trainerCode = cleanValue.replace(/(.{4})/g, '$1 ').trim();
        }
    
        // Handle Location input changes
        if (name === 'location') {
            setShowLocationWarning(true);
            setSelectedCoordinates(null);
            updatedValues.coordinates = { latitude: '', longitude: '' };
            updatedValues.allowLocation = false;
    
            // Immediately update the input value
            setValues(updatedValues);
    
            // Fetch suggestions after state update
            if (value.length > 2) {
                const fetchedSuggestions = await fetchSuggestions(value);
                setSuggestions(fetchedSuggestions);
            } else {
                setSuggestions([]);
            }
    
            // Validate if submission was attempted
            if (hasSubmitted) {
                const validationErrors = validate(updatedValues);
                setErrors(validationErrors);
            }
    
            return; // Exit early to avoid duplicate state update
        }
    
        // Validate and update state for other fields
        if (hasSubmitted) {
            const validationErrors = validate(updatedValues);
            setErrors(validationErrors);
        }
    
        setValues(updatedValues);
    };

    // Handle form submission
    const handleSubmit = (event) => {
        event.preventDefault();
        setHasSubmitted(true);
        if (validate(values)) {
            onSubmit(values);
        } else {
            console.log("Validation errors:", errors);
        }
    };    
 
    // onSubmit function defined inside the hook
    const onSubmit = (vals) => {
        if (isEditable) {
            // Prepare submission data
            let submissionValues = {
                ...vals,
                trainerCode: vals.trainerCode.replace(/\s+/g, ''),
                coordinates: selectedCoordinates ?? prevCoordinates,
            };

            // Conditionally include password fields if they are filled
            if (vals.password.trim() !== '' && vals.confirmPassword.trim() !== '') {
                submissionValues.password = vals.password;
                submissionValues.confirmPassword = vals.confirmPassword;
            } else {
                // Remove password fields if they are empty to avoid changing the password
                delete submissionValues.password;
                delete submissionValues.confirmPassword;
            }

            console.log("Submitting values:", submissionValues);
            
            // Delete location from local storage if allowLocation is false
            if (!submissionValues.allowLocation) {
                localStorage.removeItem('location');
            }

            handleUpdateUserDetails(user.user_id, submissionValues, setIsEditable);
        }
    };    
 
    // Toggle edit mode and clear password fields when disabling edit mode
    const handleEditToggle = (e) => {
        e.preventDefault();
        if (isEditable) {
            // If currently editable and about to toggle to non-editable, clear password fields
            setValues(prevValues => ({
                ...prevValues,
                password: '',
                confirmPassword: ''
            }));
            setErrors(prevErrors => ({
                ...prevErrors,
                password: '',
                confirmPassword: ''
            }));
        }
        setIsEditable(!isEditable);
    };

    // Updated to show warning on focus
    const handleLocationInputFocus = () => {
        setShowLocationWarning(true);
    };

    const handleLocationInputBlur = () => setShowLocationWarning(false);

    const selectSuggestion = (suggestion) => {
        const { name, city, state_or_province, country } = suggestion;
        const locationParts = [name || city, state_or_province, country].filter(Boolean);
        const formattedLocation = locationParts.join(', ');

        setValues((prev) => ({ ...prev, location: formattedLocation }));
        setSuggestions([]);
    };

    const handleAllowLocationChange = async (e) => {
        const allowLocation = e.target.checked;
    
        setValues((prev) => ({
            ...prev,
            allowLocation,
            coordinates: allowLocation ? prev.coordinates : { latitude: '', longitude: '' }, // Clear coordinates if disabling location
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

    // Modified to disable allowLocation when manually selecting coordinates
    const handleCoordinatesSelect = (coordinates) => {
        setSelectedCoordinates(coordinates);
        setValues((prev) => ({
            ...prev,
            coordinates,
            allowLocation: false, // Disable automatic location collection
        }));
    };

    const handleLocationUpdate = (location) => {
        const { name, city, state_or_province, country } = location;
        const locationParts = [name || city, state_or_province, country].filter(Boolean);
        const formattedLocation = locationParts.join(', ');

        setValues((prev) => ({
            ...prev,
            location: formattedLocation,
        }));
    };

    const handleOverlayLocationSelect = (location) => {
        const { name, city, state_or_province, country } = location;
        const locationParts = [name || city, state_or_province, country].filter(Boolean);
        const formattedLocation = locationParts.join(', ');

        setValues((prev) => ({
            ...prev,
            location: formattedLocation,
        }));

        setShowOptionsOverlay(false);
        setLocationOptions([]);
    };

    // Optional: Function to clear manually set coordinates
    const clearManualCoordinates = () => {
        setSelectedCoordinates(null);
        setValues((prev) => ({
            ...prev,
            coordinates: { latitude: '', longitude: '' },
            allowLocation: false,
        }));
    };

    // Effect to clear password fields after successful update or toggling out of edit mode
    useEffect(() => {
        if (!isEditable) {
            setValues(prevValues => ({
                ...prevValues,
                password: '',
                confirmPassword: ''
            }));
            setErrors(prevErrors => ({
                ...prevErrors,
                password: '',
                confirmPassword: ''
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
        showLocationWarning, // Exposed state
        setErrors,
        clearManualCoordinates,
        resetForm 
    };
};

export default useAccountForm;
