// Login.jsx

import React, { useState } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage'; // Ensure this is imported
import useForm from './hooks/useForm';
import { loginUser } from './services/authService';
import './Login.css';

function Login() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    password: '',
  }, onSubmit);
  const [feedback, setFeedback] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function onSubmit(formValues) {
    loginUser(formValues)
      .then(response => {
        setIsLoggedIn(true);
        setFeedback('Successfully Logged in');
      })
      .catch(error => {
        setFeedback('Login failed: ' + (error.response.data.message || 'Please check your username and password and try again.'));
      });
  }

  return (
    <div>
      {isLoggedIn ? (
        <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully logged in!" />
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





