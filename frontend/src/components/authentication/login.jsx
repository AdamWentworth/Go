// Login.jsx

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import useForm from './hooks/useForm';
import { loginUser } from './services/authService';
import './Login.css';

function Login() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    password: '',
  }, onSubmit);
  const [feedback, setFeedback] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to check login status

  function onSubmit(formValues) {
    loginUser(formValues)
      .then(response => {
        console.log('Login Success:', response);
        setIsLoggedIn(true); // Set logged in status to true
        setFeedback('Successfully Logged in');
      })
      .catch(error => {
        console.error('Login Failed:', error);
        setFeedback('Login failed: ' + (error.response.data.message || 'Please check your username and password and try again.'));
      });
  }

  return (
    <div>
      {isLoggedIn ? (
        <div className="success-message">{feedback}</div>
      ) : (
        <>
          {feedback && <div className="feedback">{feedback}</div>}
          <LoginForm
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

export default Login;




