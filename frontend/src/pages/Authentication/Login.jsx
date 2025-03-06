// src/components/Login.jsx

import React, { useState } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import useLoginForm from './hooks/useLoginForm';
import {
  loginUser,
  fetchOwnershipData,
  resetPassword,
} from '../../services/authService';
import './Login.css';
import { useAuth } from '../../contexts/AuthContext';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useTradeData } from '../../contexts/TradeDataContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResetPasswordOverlay from './ResetPasswordOverlay'; // Import the overlay component

function Login() {
  const initialFormValues = {
    username: '',
    password: '',
  };

  const { values, errors, handleChange, handleSubmit } = useLoginForm(initialFormValues, onSubmit);
  const [feedback, setFeedback] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { setOwnershipData } = usePokemonData();
  const { setTradeData, setRelatedInstances } = useTradeData();

  // State for managing the visibility of the reset password overlay
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  async function onSubmit(formValues) {
    setIsLoading(true);
    try {
      const response = await loginUser(formValues);
      const {
        email,
        username,
        pokemonGoName,
        trainerCode,
        user_id,
        token,
        allowLocation,
        location,
        coordinates,
        accessTokenExpiry,
        refreshTokenExpiry,
      } = response;

      const user = {
        email,
        username,
        pokemonGoName,
        trainerCode,
        user_id,
        allowLocation,
        location,
        coordinates,
        accessTokenExpiry,
        refreshTokenExpiry,
      };

      login(user, token);

      // Fetch ownership data
      const ownershipData = await fetchOwnershipData(user.user_id);
      console.log('Ownership Data:', ownershipData.pokemon_instances);
      console.log('Trades Data:', ownershipData.trades);
      console.log('Related Instances:', ownershipData.related_instances);
      setOwnershipData(ownershipData.pokemon_instances);
      setTradeData(ownershipData.trades);
      setRelatedInstances(ownershipData.related_instances)

      setIsSuccessful(true);
      setFeedback('Successfully Logged in');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        'Please check your username/email and password and try again.';
      toast.error('Login failed: ' + errorMessage);
      setIsSuccessful(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Handler to open the reset password overlay
  const handleResetPassword = () => {
    setIsResetPasswordOpen(true);
  };

  // Handler to close the reset password overlay
  const closeResetPassword = () => {
    setIsResetPasswordOpen(false);
  };

  return (
    <div className="login-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : isSuccessful ? (
        <SuccessMessage
          mainMessage={feedback}
          detailMessage="You are now successfully logged in!"
        />
      ) : (
        <LoginForm
          values={values}
          errors={errors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onResetPassword={handleResetPassword} // Pass the handler to LoginForm
        />
      )}
      {isResetPasswordOpen && <ResetPasswordOverlay onClose={closeResetPassword} />}
    </div>
  );
}

export default Login;
