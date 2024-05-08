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
    password: '',
  }, onSubmit);
  const [feedback, setFeedback] = useState('');
  const { login } = useAuth(); // Get login function from context

  function onSubmit(formValues) {
    loginUser(formValues)
      .then(userData => {
        login(userData); // Assume loginUser directly returns userData
        setFeedback('Successfully Logged in');
      })
      .catch(error => {
        const errorMessage = error.response?.data?.message || 'Please check your username and password and try again.';
        setFeedback('Login failed: ' + errorMessage);
      });
  }  

  return (
    <div>
      {feedback && <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully logged in!" />}
      {!feedback && <LoginForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />}
    </div>
  );
}

export default Login;
