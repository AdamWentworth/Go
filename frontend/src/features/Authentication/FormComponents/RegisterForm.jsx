// RegisterForm.jsx

import React from 'react';
import RegisterSocialButtons from '../0AuthComponents/RegisterSocialButtons';
import CoordinateSelector from '../CoordinateSelector';
import './RegisterForm.css';
import useRegisterForm from '../hooks/useRegisterForm';

const RegisterForm = ({ onSubmit, errors }) => {
  const {
    values,
    isMapVisible,
    setIsMapVisible,
    selectedCoordinates,
    showLocationWarning,
    suggestions,
    handleInputChange,
    handleAllowLocationChange,
    handleCoordinatesSelect,
    handleCheckboxChange,
    handleLocationInputFocus,
    handleLocationInputBlur,
    selectSuggestion,
    handleLocationUpdate,
  } = useRegisterForm();

  return (
    <div className="register-page">
      <div className="register-form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
        >
          {/* Left Form Section */}
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

          {/* Right Form Section */}
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
                : 'Set Coordinates'}
            </button>
          </div>

          {/* Location Input Section */}
          <div className="form-location" style={{ position: 'relative' }}>
            <input
              type="text"
              name="locationInput"
              value={values.locationInput}
              onFocus={handleLocationInputFocus}
              onBlur={handleLocationInputBlur}
              onChange={handleInputChange}
              placeholder="City / Place, State / Province / Region, Country (optional)"
            />
            {showLocationWarning && (
              <div
                className="location-warning"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'orange',
                  fontSize: '12px',
                }}
              >
                Modifying this resets coordinates.
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-submit">
            <button type="submit" className="submit-button">
              Register
            </button>
          </div>

          {/* Social Buttons */}
          <RegisterSocialButtons />
        </form>
      </div>

      {/* Coordinate Selector */}
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
