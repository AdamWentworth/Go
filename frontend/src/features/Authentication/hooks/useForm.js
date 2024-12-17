// useForm.js

import { useState, useCallback } from 'react';

const useForm = (initialValues, onSubmit, formType) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

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

    // Handles field value changes
    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        let updatedValues = {
            ...values,
            [name]: type === 'checkbox' ? checked : value
        };

        // Sync Pokémon GO name with username if checkbox is checked
        if (name === 'pokemonGoNameDisabled' && checked) {
            updatedValues.pokemonGoName = updatedValues.username;
        }

        // Format trainer code to display in XXXX XXXX XXXX format as user types
        if (name === 'trainerCode' && value.replace(/\s+/g, '').length <= 12) {
            updatedValues.trainerCode = value.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
        }

        setValues(updatedValues);
    };

    // Expose a method to manually set errors from outside
    const handleSetErrors = useCallback((newErrors) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            ...newErrors
        }));
    }, []);

    // Handles form submission
    const handleSubmit = (event) => {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
    
        if (validate(values)) {
            setErrors({}); // Clear all errors
            onSubmit(values); // Submit valid form values
        } else {
            console.error("Validation failed:", errors); // Log validation errors
        }
    };
    

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
        setErrors: handleSetErrors // Expose setErrors to allow external updates
    };
};

export default useForm;


