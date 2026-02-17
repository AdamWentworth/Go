// src/components/Register.tsx

import { useState, FC } from 'react';
import RegisterForm from './FormComponents/RegisterForm';
import SuccessMessage from './SuccessMessage';
import useRegisterForm from './hooks/useRegisterForm';
import { registerUser, loginUser } from '../../services/authService';
import './Register.css';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '../../components/LoadingSpinner';
import ActionMenu from '../../components/ActionMenu';
import { isApiError } from '../../utils/errors';
import { updateUserInSecondaryDB } from "@/services/authService";
import { createScopedLogger } from '@/utils/logger';

// Import centralized types.
import type { RegisterFormValues, User, LoginResponse } from '../../types/auth';

const log = createScopedLogger('Register');

const Register: FC = () => {
  // useRegisterForm provides all the state and handlers for our register form.
  const {
    values, 
    errors, 
    handleSubmit, 
    handleInputChange,
    handleCheckboxChange,
    handleAllowLocationChange,
    handleCoordinatesSelect,
    handleLocationInputFocus,
    handleLocationInputBlur,
    selectSuggestion,
    handleLocationUpdate,
    handleOverlayLocationSelect,
    isMapVisible,
    setIsMapVisible,
    selectedCoordinates,
    showLocationWarning,
    suggestions,
    showOptionsOverlay,
    setShowOptionsOverlay,
    locationOptions,
    setErrors
  } = useRegisterForm(onSubmit);

  const [feedback, setFeedback] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();

  // The onSubmit callback invoked when the registration form is submitted.
  async function onSubmit(formValues: RegisterFormValues): Promise<void> {
    log.debug('Form values submitted.', { username: formValues.username });
    
    // Sanitize form values.
    const sanitizedFormValues: RegisterFormValues = {
      ...formValues,
      username: formValues.username.trim(),
      trainerCode: formValues.trainerCode.replace(/\s+/g, ''),
    };

    // Set loading to true when submission starts.
    setIsLoading(true);

    try {
      // Register the user.
      await registerUser(sanitizedFormValues);
      log.info('Registration successful.');

      // Wait for 2 seconds before attempting login.
      setTimeout(async () => {
        try {
          // Login using the provided username and password.
          const loginResponse = (await loginUser({
            username: formValues.username,
            password: formValues.password,
          })) as LoginResponse;
          log.info('Login successful.');

          // Construct a User object matching our centralized User type.
          const user: User = {
            user_id: loginResponse.user_id,
            email: loginResponse.email,
            username: loginResponse.username,
            pokemonGoName: loginResponse.pokemonGoName,
            trainerCode: loginResponse.trainerCode,
            allowLocation: loginResponse.allowLocation,
            location: loginResponse.location,
            coordinates: loginResponse.coordinates,
            accessTokenExpiry: loginResponse.accessTokenExpiry,
            refreshTokenExpiry: loginResponse.refreshTokenExpiry,
          };

          if (user) {
            // Call login from AuthContext. Adjust the login function's signature
            // in AuthContext so that it accepts the user object as needed.
            login(user);

            // ──► NEW: seed MySQL immediately
           const coords = formValues.coordinates;
           void updateUserInSecondaryDB(user.user_id, {
             username: user.username,
             ...(coords && {
               latitude: coords.latitude,
               longitude: coords.longitude
             }),
             ...(formValues.pokemonGoName && {
               pokemonGoName: formValues.pokemonGoName
             })
           });

            setIsRegistered(true);
            setFeedback('Successfully Registered and Logged in');
          } else {
            toast.error('Login successful but user details are incorrect.');
          }
        } catch (loginError) {
          log.error('Login error:', loginError);
          toast.error('Registration successful, but login failed. Please try to log in.');
        } finally {
          // Set loading to false after login attempt.
          setIsLoading(false);
        }
      }, 2000);
    } catch (error: unknown) {
      log.error('Registration error:', error);
    
      if (isApiError(error)) {
        const message = error.response.data.message;
    
        setErrors({
          username: message.includes('Username') ? 'This username is already taken.' : '',
          email: message.includes('Email') ? 'This email is already in use.' : '',
          pokemonGoName: message.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
          trainerCode: message.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
        });
    
        toast.error('Registration failed: ' + message);
      } else {
        toast.error('Registration failed: Please check your input and try again.');
      }
    
      setIsLoading(false);
    }    
  }  

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : isRegistered ? (
        <SuccessMessage 
          mainMessage={feedback} 
          detailMessage="You are now successfully registered and logged in!" 
        />
      ) : (
        <RegisterForm 
          onSubmit={handleSubmit} 
          errors={errors} 
          values={values}
          handleInputChange={handleInputChange}
          handleCheckboxChange={handleCheckboxChange}
          handleAllowLocationChange={handleAllowLocationChange}
          handleCoordinatesSelect={handleCoordinatesSelect}
          handleLocationInputFocus={handleLocationInputFocus}
          handleLocationInputBlur={handleLocationInputBlur}
          selectSuggestion={selectSuggestion}
          handleLocationUpdate={handleLocationUpdate}
          handleOverlayLocationSelect={handleOverlayLocationSelect}
          isMapVisible={isMapVisible}
          setIsMapVisible={setIsMapVisible}
          selectedCoordinates={selectedCoordinates}
          showLocationWarning={showLocationWarning}
          suggestions={suggestions}
          showOptionsOverlay={showOptionsOverlay}
          setShowOptionsOverlay={setShowOptionsOverlay}
          locationOptions={locationOptions}
        />
      )}
      {/* Render the ActionMenu component */}
      <ActionMenu />
      <ToastContainer />
    </div>
  );
};

export default Register;
