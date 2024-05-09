// useForm.js

import { useState, useEffect } from 'react';

const useForm = (initialValues, onSubmit, formType) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // Function to validate inputs
  const validate = (values) => {
    let tempErrors = {};

    if ('username' in values)
      tempErrors.username = values.username ? "" : "Username is required.";

    if ('email' in values)
      tempErrors.email = (/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(values.email)) ? "" : "Email is not valid.";

    // Adjust password validation based on form type
    if (formType === 'register' || (formType === 'edit' && values.password)) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d@#$%^&*!?.]{8,}$/;
      tempErrors.password = passwordRegex.test(values.password) ? "" : "Password must be at least 8 characters long and include at least one uppercase, one lowercase, one number, and one special character.";
    }

    if ('trainerCode' in values) {
      tempErrors.trainerCode = (values.trainerCode.length === 12 && /^\d{12}$/.test(values.trainerCode)) || values.trainerCode === "" ? "" : "Trainer code must be exactly 12 digits long.";
    }

    setErrors({
      ...tempErrors
    });

    return Object.values(tempErrors).every(x => x === "");
  };

  // Handles field value changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    let updatedValues = {
      ...values,
      [name]: type === 'checkbox' ? checked : value
    };

    // Sync Pokémon GO name with username if the relevant checkbox is checked
    if (name === 'pokemonGoNameDisabled' && checked) {
      updatedValues.pokemonGoName = updatedValues.username;
    }

    setValues(updatedValues);
  };

  // Handles form submission
  const handleSubmit = (event) => {
    event.preventDefault(); // Safely call preventDefault
    if (validate(values)) {
        onSubmit(values);
    } else {
        console.log("Validation errors:", errors);
    }
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit
  };
};

export default useForm;
