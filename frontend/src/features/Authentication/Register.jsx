// Register.jsx

import React, { useState } from 'react';
import RegisterForm from './FormComponents/RegisterForm';
import SuccessMessage from './SuccessMessage';
import useRegisterForm from './hooks/useRegisterForm';
import { registerUser, loginUser } from './services/authService';
import './Register.css';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '../../components/LoadingSpinner'; // Import the LoadingSpinner component

function Register() {
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
    setErrors // Ensure setErrors is destructured from the hook
  } = useRegisterForm(onSubmit);

  const [feedback, setFeedback] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const { login } = useAuth();

  async function onSubmit(formValues) {
    console.log("Form Values:", formValues);
    
    // Sanitize form values
    const sanitizedFormValues = {
      ...formValues,
      trainerCode: formValues.trainerCode.replace(/\s+/g, ''),
    };

    // Set loading to true when submission starts
    setIsLoading(true);

    try {
      // Register the user
      await registerUser(sanitizedFormValues);
      console.log("Registration successful.");

      // Wait for 2 seconds before logging in
      setTimeout(async () => {
        try {
          const loginResponse = await loginUser({ username: formValues.username, password: formValues.password });
          console.log("Login successful.");

          const user = {
            user_id: loginResponse.user_id,
            email: loginResponse.email,
            username: loginResponse.username,
            pokemonGoName: loginResponse.pokemonGoName,
            trainerCode: loginResponse.trainerCode,
            allowLocation: loginResponse.allowLocation,
            country: loginResponse.country,
            city: loginResponse.city,
            accessTokenExpiry: loginResponse.accessTokenExpiry,
            refreshTokenExpiry: loginResponse.refreshTokenExpiry
          };

          if (user) {
            login(user);
            setIsRegistered(true);
            setFeedback('Successfully Registered and Logged in');
          } else {
            toast.error('Login successful but user details are incorrect.');
          }
        } catch (loginError) {
          console.error("Login Error:", loginError);
          toast.error('Registration successful, but login failed. Please try to log in.');
        } finally {
          // Set loading to false after login attempt
          setIsLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error("Registration Error:", error);
      
      if (error.response && error.response.status === 409) {
        setErrors({
          username: error.response.data.message.includes('Username') ? 'This username is already taken.' : '',
          email: error.response.data.message.includes('Email') ? 'This email is already in use.' : '',
          pokemonGoName: error.response.data.message.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
          trainerCode: error.response.data.message.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
        });
      }
      toast.error('Registration failed: ' + (error.response ? error.response.data.message : 'Please check your input and try again.'));
      
      // Set loading to false on error
      setIsLoading(false);
    }      
  }  

  return (
    <div>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {isLoading ? (
        <LoadingSpinner /> // Show spinner while loading
      ) : isRegistered ? (
        <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully registered and logged in!" />
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
    </div>
  );
}

export default Register;
