// Register.jsx
import React, { useState } from 'react';
import RegisterForm from './FormComponents/RegisterForm';
import SuccessMessage from './SuccessMessage';
import useForm from './hooks/useForm';
import { registerUser, loginUser } from './services/authService';
import './Register.css';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Register() {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm({
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
  const [isRegistered, setIsRegistered] = useState(false); // State to track if registration is successful
  const { login } = useAuth();

  function onSubmit(formValues) {
    // Remove spaces from trainerCode before sending to the backend
    const sanitizedFormValues = {
      ...formValues,
      trainerCode: formValues.trainerCode.replace(/\s+/g, '')
    };

    registerUser(sanitizedFormValues)
      .then(response => {
        setTimeout(() => {
          loginUser({ username: formValues.username, password: formValues.password })
            .then(loginResponse => {
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
                setIsRegistered(true); // Set registered state to true
                setFeedback('Successfully Registered and Logged in');
              } else {
                toast.error('Login successful but user details are incorrect.');
              }
            })
            .catch(loginError => {
              toast.error('Registration successful, but login failed. Please try to log in.');
            });
        }, 2000);
      })
      .catch(error => {
        if (error.response && error.response.status === 409) {
          setErrors(prevErrors => ({
            ...prevErrors,
            username: error.response.data.message.includes('Username') ? 'This username is already taken.' : '',
            email: error.response.data.message.includes('Email') ? 'This email is already in use.' : '',
            pokemonGoName: error.response.data.message.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
            trainerCode: error.response.data.message.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
          }));
        }
        toast.error('Registration failed: ' + (error.response ? error.response.data.message : 'Please check your input and try again.'));
      });      
  }  

  return (
    <div>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      {isRegistered ? 
        <SuccessMessage mainMessage={feedback} detailMessage="You are now successfully registered and logged in!" /> :
        <RegisterForm values={values} errors={errors} onChange={handleChange} onSubmit={handleSubmit} />
      }
    </div>
  );
}

export default Register;


