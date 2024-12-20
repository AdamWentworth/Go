// useLoginForm.js

import { useState, useCallback } from 'react';

const useLoginForm = (initialValues, onSubmit) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    // Regular expression for validating email addresses
    const emailRegex = /^([a-zA-Z0-9_.+-])+@([a-zA-Z0-9-]+\.)+([a-zA-Z0-9]{2,4})+$/;

    // Validation for login form
    const validate = (values) => {
        const tempErrors = {};

        // Username validation: required and must be either a valid email or a non-empty username
        if (!values.username.trim()) {
            tempErrors.username = "Username or Email is required.";
        } else if (values.username.includes('@') && !emailRegex.test(values.username)) {
            tempErrors.username = "Please enter a valid email address.";
        }

        // Password validation: required
        if (!values.password) {
            tempErrors.password = "Password is required.";
        }

        setErrors(tempErrors);
        // Return true if no errors
        return Object.keys(tempErrors).length === 0;
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value,
        });
    };

    // Handle form submission
    const handleSubmit = (event) => {
        event.preventDefault();
        if (validate(values)) {
            onSubmit(values);
        }
    };

    // Optionally, expose a method to manually set errors if needed
    const setFormErrors = useCallback((newErrors) => {
        setErrors((prevErrors) => ({
            ...prevErrors,
            ...newErrors,
        }));
    }, []);

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
        setErrors: setFormErrors, // Optional
    };
};

export default useLoginForm;
