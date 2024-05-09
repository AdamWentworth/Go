// Register.jsx

import React, { useState } from 'react';
import RegisterForm from './FormComponents/RegisterForm';
import SuccessMessage from './SuccessMessage';
import useForm from './hooks/useForm';
import { registerUser, loginUser } from './services/authService';
import './Register.css';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

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
  }, onSubmit, 'register');
  const [feedback, setFeedback] = useState('');
  const { login } = useAuth(); // Get login function from context

  function onSubmit(formValues) {
    registerUser(formValues)
      .then(response => {
        console.log('Registration Success:', response);
        setTimeout(() => {
          loginUser({ username: formValues.username, password: formValues.password })
            .then(loginResponse => {
              // Create the user object from the response details
              const user = {
                email: loginResponse.email,
                username: loginResponse.username,
                pokemonGoName: loginResponse.pokemonGoName,
                trainerCode: loginResponse.trainerCode,
                user_id: loginResponse.user_id
              };
              const { token } = loginResponse;
  
              if (user && token) {
                login(user, token); // Pass user and token to login function
                setFeedback('Successfully Registered and Logged in');
              } else {
                // Handle cases where the response might not be in expected format
                console.error('Unexpected login response structure:', loginResponse);
                setFeedback('Login successful but user details are incorrect.');
              }
            })
            .catch(loginError => {
              console.error('Login failed:', loginError);
              setFeedback('Registration successful, but login failed. Please try to log in.');
            });
        }, 2000);
      })
      .catch(error => {
        console.error('Registration failed:', error);
        setFeedback('Registration failed: ' + (error.response.data.message || 'Please check your input and try again.'));
      });
  }  

  return (
    <div>
      {feedback && <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully registered and logged in!" />}
      {!feedback && <RegisterForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />}
    </div>
  );
}

export default Register;
