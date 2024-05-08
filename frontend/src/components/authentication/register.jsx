// Register.jsx

import React, { useState } from 'react';
import RegisterForm from './FormComponents/RegisterForm';
import SuccessMessage from './SuccessMessage'; // Ensure this is imported
import useForm from './hooks/useForm';
import { registerUser, loginUser } from './services/authService';
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
  const [feedback, setFeedback] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function onSubmit(formValues) {
    registerUser(formValues)
      .then(response => {
        console.log('Registration Success:', response);
        setTimeout(() => {
          loginUser({ username: formValues.username, password: formValues.password })
            .then(loginResponse => {
              setIsLoggedIn(true);
              setFeedback('Successfully Registered and Logged in');
            })
            .catch(loginError => {
              setFeedback('Registration successful, but login failed. Please try to log in.');
            });
        }, 2000);
      })
      .catch(error => {
        setFeedback('Registration failed: ' + (error.response.data.message || 'Please check your input and try again.'));
      });
  }

  return (
    <div>
      {isLoggedIn ? (
        <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully registered and logged in!" />
      ) : (
        <>
          {feedback && <div className="feedback">{feedback}</div>}
          <RegisterForm
            values={values}
            errors={errors}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}

export default Register;
