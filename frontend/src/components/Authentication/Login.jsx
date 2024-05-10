// Login.jsx

import React, { useState } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage';
import useForm from './hooks/useForm';
import { loginUser } from './services/authService';
import './Login.css';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

function Login() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    password: ''
  }, onSubmit, 'login');
  const [feedback, setFeedback] = useState('');
  const { login } = useAuth(); // Get login function from context

  function onSubmit(formValues) {
    loginUser(formValues)
      .then(response => {
        // Assuming the API sends back the user data and token as part of the response data object
        const { email, username, pokemonGoName, trainerCode, user_id, token, allowLocation, country, city } = response;
        const user = {
          email,
          username,
          pokemonGoName,
          trainerCode,
          user_id,
          allowLocation,
          country,
          city,
        };

        login(user, token); // Pass user and token to login function
        setFeedback('Successfully Logged in');
      })
      .catch(error => {
        const errorMessage = error.response?.data?.message || 'Please check your username and password and try again.';
        setFeedback('Login failed: ' + errorMessage);
      });
  } 

  return (
    <div>
      {feedback && (
        <SuccessMessage mainMessage={feedback} detailMessage={feedback.startsWith('Successfully') ? "You are now successfully logged in!" : ""} />
      )}
      {!feedback && <LoginForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />}
    </div>
  );
}

export default Login;
