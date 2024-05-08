// Register.jsx

import React from 'react';
import RegisterForm from './RegisterForm';
import useForm from './hooks/useForm';
import { registerUser } from './services/authService';
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
    const { pokemonGoNameDisabled, ...submissionValues } = formValues;
  
    // Use the registerUser function to send data to the backend
    registerUser(submissionValues)
      .then(response => {
        console.log('Registration Success:', response);
        // Handle success, perhaps redirect or clear form
      })
      .catch(error => {
        console.error('Registration Failed:', error);
        // Handle errors, show user feedback
      });
  }

  console.log("API URL: ", process.env.REACT_APP_AUTH_API_URL);

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
