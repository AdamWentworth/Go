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
    pokemonGoNameDisabled: false,
    locationInput: '', // Combined input for City/Place, State/Province/Region, Country
  });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

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

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;

    setValues((prevValues) => ({
      ...prevValues,
      [name]: checked,
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    // Reset coordinates if locationInput is modified
    if (name === 'locationInput') {
      setSelectedCoordinates(null);
      setValues((prevValues) => ({
        ...prevValues,
        coordinates: null, // Clear coordinates when manually editing location input
      }));
    }

    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  // Show warning when the user focuses on the location input
  const handleLocationInputFocus = () => {
    if (selectedCoordinates) {
      setShowLocationWarning(true);
    }
  };

  // Hide warning on blur
  const handleLocationInputBlur = () => {
    setShowLocationWarning(false);
  };

  const handleLocationUpdate = (location) => {
    const { name, city, state_or_province, country } = location;

    const locationParts = [
      name || city,
      state_or_province,
      country,
    ];

    const formattedLocation = locationParts.filter(Boolean).join(', ');

    setValues((prevValues) => ({
      ...prevValues,
      locationInput: formattedLocation,
    }));
  };

  return (
    <div className="register-page">
      <div className="register-form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="form-left">
            <input
              type="text"
              name="username"
              value={values.username}
              onChange={handleInputChange}
              placeholder="Username (must be unique)"
              required
            />
            <div className="checkbox-inline">
              <input
                type="checkbox"
                name="pokemonGoNameDisabled"
                checked={values.pokemonGoNameDisabled}
                onChange={handleCheckboxChange}
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
          </div>

          <div className="form-right">
            <input
              type="text"
              name="pokemonGoName"
              value={values.pokemonGoName}
              onChange={handleInputChange}
              placeholder="Pokémon GO name (optional)"
              disabled={values.pokemonGoNameDisabled}
            />
            <input
              type="text"
              name="trainerCode"
              value={values.trainerCode}
              onChange={handleInputChange}
              placeholder="Trainer Code (optional)"
            />
            {errors.trainerCode && <div style={{ color: 'red' }}>{errors.trainerCode}</div>}
            <div className="checkbox-inline">
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
          </div>

          <div className="form-location" style={{ position: 'relative' }}>
            <input
              type="text"
              name="locationInput"
              value={values.locationInput}
              onFocus={handleLocationInputFocus}
              onBlur={handleLocationInputBlur}
              onChange={handleInputChange}
              placeholder="City, State / Province / Region, Country (optional)"
            />
            {showLocationWarning && (
              <div className="location-warning" style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'orange',
                fontSize: '12px',
              }}>
                Modifying this resets coordinates.
              </div>
            )}
          </div>

          <div className="form-submit">
            <button type="submit" className="submit-button">
              Register
            </button>
          </div>

          <div className="form-social">
            <GoogleLoginButton onClick={() => alert('Google login is not yet implemented.')}>
              Register with Google
            </GoogleLoginButton>
            <FacebookLoginButton onClick={() => alert('Facebook login is not yet implemented.')}>
              Register with Facebook
            </FacebookLoginButton>
            <TwitterLoginButton onClick={() => alert('Twitter login is not yet implemented.')}>
              Register with Twitter
            </TwitterLoginButton>
          </div>
        </form>
        </div>
      {isMapVisible && (
        <CoordinateSelector
          onCoordinatesSelect={handleCoordinatesSelect}
          onLocationSelect={handleLocationUpdate}
          onClose={() => setIsMapVisible(false)}
        />
      )}
    </div>
  );
};

export default RegisterForm;