// Register.jsx

import React, { useState } from 'react';
import RegisterForm from './RegisterForm';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to check login status

  function onSubmit(formValues) {
    registerUser(formValues)
      .then(response => {
        console.log('Registration Success:', response);
        // Log what we are sending for login, which should be the username
        console.log(`Logging in with username: ${formValues.username}`);
        // Delay login attempt for a few seconds to ensure database consistency
        setTimeout(() => {
          loginUser({ username: formValues.username, password: formValues.password })
            .then(loginResponse => {
              console.log('Login Success:', loginResponse);
              setIsLoggedIn(true); // Set logged in status to true
              setFeedback('Successfully Registered and Logged in');
            })
            .catch(loginError => {
              console.error('Login Failed:', loginError);
              setFeedback('Registration successful, but login failed. Please try to log in.');
            });
        }, 2000); // Delay login by 2 seconds
      })
      .catch(error => {
        console.error('Registration Failed:', error);
        setFeedback('Registration failed: ' + (error.response.data.message || 'Please check your input and try again.'));
      });
  }

  return (
    <div>
      {isLoggedIn ? (
        <div className="success-message">{feedback}</div>
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
