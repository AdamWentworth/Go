// Login.jsx
import React, { useState } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage';
import LoadingSpinner from '../../components/LoadingSpinner'; // Ensure this is imported
import useForm from './hooks/useForm';
import { loginUser, fetchOwnershipData } from '../../services/authService';
import './Login.css';
import { useAuth } from '../../contexts/AuthContext';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    username: '',
    password: ''
  }, onSubmit, 'login');
  const [feedback, setFeedback] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state to handle loading
  const { login } = useAuth();
  const { setOwnershipData } = usePokemonData();

  async function onSubmit(formValues) {
    setIsLoading(true); // Start loading before the login attempt
    try {
      const response = await loginUser(formValues);
      const { email, username, pokemonGoName, trainerCode, user_id, token, allowLocation, country, city, accessTokenExpiry, refreshTokenExpiry } = response;
      const user = {
        email,
        username,
        pokemonGoName,
        trainerCode,
        user_id,
        allowLocation,
        country,
        city,
        accessTokenExpiry,
        refreshTokenExpiry
      };

      login(user, token);

      // Fetch ownership data
      const ownershipData = await fetchOwnershipData(user.user_id);
      console.log('Ownership Data:', ownershipData);
      setOwnershipData(ownershipData);

      setIsSuccessful(true);
      setFeedback('Successfully Logged in');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Please check your username and password and try again.';
      toast.error('Login failed: ' + errorMessage);
      setIsSuccessful(false);
    } finally {
      setIsLoading(false); // Stop loading regardless of the outcome
    }
  }

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : isSuccessful ? (
        <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully logged in!" />
      ) : (
        <LoginForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

export default Login;