// Login.jsx
import React, { useState } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage';
import useForm from './hooks/useForm';
import { loginUser } from './services/authService';
import './Login.css';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify'; // Import toast and ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS

function Login() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    password: ''
  }, onSubmit, 'login');
  const [feedback, setFeedback] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false); // State to manage if login was successful
  const { login } = useAuth(); // Get login function from context

  function onSubmit(formValues) {
    loginUser(formValues)
      .then(response => {
        const { email, username, pokemonGoName, trainerCode, user_id, token, allowLocation, country, city } = response;
        const user = {
          email,
          username,
          pokemonGoName,
          trainerCode,
          user_id,
          allowLocation,
          country,
          city
        };

        login(user, token); // Pass user and token to login function
        setIsSuccessful(true);
        setFeedback('Successfully Logged in');
      })
      .catch(error => {
        const errorMessage = error.response?.data?.message || 'Please check your username and password and try again.';
        toast.error('Login failed: ' + errorMessage); // Use toast for error
        setIsSuccessful(false); // Ensure the success message does not display
      });
  }

  return (
    <div>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {isSuccessful && (
        <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully logged in!" />
      )}
      {!isSuccessful && <LoginForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />}
    </div>
  );
}

export default Login;

