// src/components/Login.tsx

import React, { useState, FC } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import useLoginForm from './hooks/useLoginForm';
import { loginUser, fetchOwnershipData } from '../../services/authService';
import './Login.css';
import { useAuth } from '../../contexts/AuthContext';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResetPasswordOverlay from './ResetPasswordOverlay';
import ActionMenu from '../../components/ActionMenu';
import { isApiError } from '../../utils/errors';

// Import centralized types.
import type { LoginFormValues } from '../../types/auth';
import type { User, LoginResponse, OwnershipResponse } from '../../types/auth';

const Login: FC = () => {
  // Initial values for the login form.
  const initialFormValues: LoginFormValues = {
    username: '',
    password: '',
  };

  // useLoginForm provides values, errors, and handler functions.
  const { values, errors, handleChange, handleSubmit } = useLoginForm(initialFormValues, onSubmit);
  const [feedback, setFeedback] = useState<string>('');
  const [isSuccessful, setIsSuccessful] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const setInstances = useInstancesStore((s) => s.setInstances);
  const setTradeData = useTradeStore((s) => s.setTradeData);
  const setRelatedInstances = useTradeStore((s) => s.setRelatedInstances);

  // State for managing the visibility of the reset password overlay.
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(false);

  // onSubmit is invoked when the form is submitted.
  async function onSubmit(formValues: LoginFormValues): Promise<void> {
    setIsLoading(true);
    try {
      // Call the login service.
      // Assuming loginUser is updated so its parameter type is compatible with LoginFormValues.
      // If loginUser returns 'unknown', we cast it to LoginResponse.
      const response = (await loginUser(formValues)) as LoginResponse;
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

      // Construct a user object matching the global User type.
      const user: User = {
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

      const enhancedUser = { ...user, token };
      login(enhancedUser);
      // Otherwise, update the AuthContext type to accept (user, token).

      // Fetch ownership data and update global state.
      // If fetchOwnershipData returns unknown, cast it.
      const ownershipData = (await fetchOwnershipData(user.user_id)) as OwnershipResponse;
      console.log('Ownership Data:', ownershipData.pokemon_instances);
      console.log('Trades Data:', ownershipData.trades);
      console.log('Related Instances:', ownershipData.related_instances);
      setInstances(ownershipData.pokemon_instances);
      setTradeData(ownershipData.trades as any);
      setRelatedInstances(ownershipData.related_instances as any);

      setIsSuccessful(true);
      setFeedback('Successfully Logged in');
    } catch (error: unknown) {
      let errorMessage = 'Please check your username/email and password and try again.';
    
      if (isApiError(error)) {
        errorMessage = error.response.data.message;
      }
    
      toast.error('Login failed: ' + errorMessage);
      setIsSuccessful(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Open the reset password overlay.
  const handleResetPassword = (): void => {
    setIsResetPasswordOpen(true);
  };

  // Close the reset password overlay.
  const closeResetPassword = (): void => {
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
          onResetPassword={handleResetPassword}
        />
      )}
      {isResetPasswordOpen && <ResetPasswordOverlay onClose={closeResetPassword} />}
      <ActionMenu />
      <ToastContainer />
    </div>
  );
};

export default Login;
