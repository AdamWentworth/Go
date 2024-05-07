// Register.jsx

import React from 'react';
import RegisterForm from './RegisterForm';
import useForm from './hooks/useForm';
import './Register.css';

function Register() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    pokemonGoName: '',
    pokemonGoNameDisabled: false,
    trainerCode: '',
    email: '',
    password: '',
    country: '',
    city: '',
    allowLocation: false
  }, onSubmit);

  function onSubmit(formValues) {
    // Create a new object that excludes the pokemonGoNameDisabled field
    const { pokemonGoNameDisabled, ...submissionValues } = formValues;

    // Use submissionValues instead of formValues for backend submission
    console.log('Submitting Registration Data:', submissionValues);

    // onRegister(submissionValues); // Uncomment when ready to integrate with the backend
  }

  return (
    <RegisterForm
      values={values}
      errors={errors}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}

export default Register;
