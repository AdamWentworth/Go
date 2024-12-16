// RegisterForm.jsx

import React, { useState } from 'react';
import { GoogleLoginButton, FacebookLoginButton, TwitterLoginButton } from 'react-social-login-buttons';
import CoordinateSelector from '../CoordinateSelector';
import './RegisterForm.css';

const RegisterForm = ({ onSubmit, errors }) => {
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    trainerCode: '',
    pokemonGoName: '',
    coordinates: null,
    allowLocation: false,
    country: '',
    city: '',
  });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  const handleCoordinatesSelect = (coordinates) => {
    console.log('Coordinates received:', coordinates);
    setSelectedCoordinates(coordinates);
    setValues((prevValues) => ({
      ...prevValues,
      coordinates,
    }));
  };

  const handleAllowLocationChange = (e) => {
    const allowLocation = e.target.checked;
    setValues((prevValues) => ({
      ...prevValues,
      allowLocation,
      coordinates: allowLocation ? null : prevValues.coordinates,
    }));
    if (allowLocation) {
      setSelectedCoordinates(null);
    }
  };

  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
    console.log('Country:', location.country);
    console.log('City:', location.name);
    setValues((prevValues) => ({
      ...prevValues,
      country: location.country,
      city: location.name || location.state_or_province || '',
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  return (
    <div className="register-page">
      <div className="register-form">
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values);
        }}>
          <div className="left-column">
            <input
              type="text"
              name="username"
              value={values.username}
              onChange={handleInputChange}
              placeholder="Username (must be unique)"
              required
            />
            <div className="checkbox-inline multi-line-checkbox">
              <input
                type="checkbox"
                name="pokemonGoNameDisabled"
                checked={values.pokemonGoNameDisabled}
                onChange={handleInputChange}
              />
              <label>Username matches my Pokémon GO account name</label>
            </div>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={handleInputChange}
              placeholder="Email (must be unique)"
              required
            />
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
            />
            {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}
            <input
              type="text"
              name="trainerCode"
              value={values.trainerCode}
              onChange={handleInputChange}
              placeholder="Trainer Code (optional)"
            />
            {errors.trainerCode && <div style={{ color: 'red' }}>{errors.trainerCode}</div>}
          </div>
          <div className="right-column">
            <input
              type="text"
              name="pokemonGoName"
              value={values.pokemonGoName}
              onChange={handleInputChange}
              placeholder="Pokémon GO name (optional)"
              disabled={values.pokemonGoNameDisabled}
            />
            <div className="checkbox-inline multi-line-checkbox">
              <input
                type="checkbox"
                name="allowLocation"
                checked={values.allowLocation}
                onChange={handleAllowLocationChange}
              />
              <label>Enable collection of your device's GPS location data</label>
            </div>
            <button
              type="button"
              className="set-coordinates-button"
              onClick={() => setIsMapVisible(true)}
              disabled={values.allowLocation}
            >
              {selectedCoordinates
                ? `Coordinates Set: (${selectedCoordinates.latitude}, ${selectedCoordinates.longitude})`
                : 'Set Coordinates (optional)'}
            </button>
            <input
              type="text"
              name="country"
              value={values.country}
              onChange={handleInputChange}
              placeholder="Country (optional)"
            />
            <input
              type="text"
              name="city"
              value={values.city}
              onChange={handleInputChange}
              placeholder="City (optional)"
            />
          </div>
          <button type="submit">Register</button>
          <div className="social-login-buttons">
            <GoogleLoginButton
              title="Not yet implemented"
              onClick={() => alert('Google login is not yet implemented.')}
            >
              Register with Google
            </GoogleLoginButton>
            <FacebookLoginButton
              title="Not yet implemented"
              onClick={() => alert('Facebook login is not yet implemented.')}
            >
              Register with Facebook
            </FacebookLoginButton>
            <TwitterLoginButton
              title="Not yet implemented"
              onClick={() => alert('Twitter login is not yet implemented.')}
            >
              Register with Twitter
            </TwitterLoginButton>
          </div>
        </form>
      </div>
      {isMapVisible && (
        <CoordinateSelector
          onCoordinatesSelect={handleCoordinatesSelect}
          onLocationSelect={handleLocationSelect}
          onClose={() => setIsMapVisible(false)}
        />
      )}
    </div>
  );
};

export default RegisterForm;