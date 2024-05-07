import React from 'react';
import RegisterForm from './RegisterForm'; // Import the modular form component
import useForm from './hooks/useForm'; // Import the useForm custom hook
import './register.css';

function Register({ onRegister }) {
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
    // Here you would add the additional logic or data modifications before sending to the API
    if (!errors) {
      onRegister(formValues); // Function to call the API
    }
  }

  return (
    <RegisterForm
      {...values}
      errors={errors}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}

export default Register;
