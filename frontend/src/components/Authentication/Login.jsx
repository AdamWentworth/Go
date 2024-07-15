// Login.jsx
import React, { useState } from 'react';
import LoginForm from './FormComponents/LoginForm';
import SuccessMessage from './SuccessMessage';
import useForm from './hooks/useForm';
import { loginUser, fetchOwnershipData } from './services/authService';
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
  const { login } = useAuth();
  const { setOwnershipData } = usePokemonData();

  async function onSubmit(formValues) {
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
    }
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