// RegisterForm.jsx
import React from 'react';
import RegisterSocialButtons from '../0AuthComponents/RegisterSocialButtons';
import CoordinateSelector from '../CoordinateSelector';
import LocationOptionsOverlay from '../LocationOptionsOverlay';
import './RegisterForm.css';

const RegisterForm = ({
  onSubmit,
  errors,
  values,
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
  locationOptions
}) => {
  return (
    <div className="register-page">
      <div className="register-form">
        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            onSubmit(); // Trigger the centralized handleSubmit
          }}
          noValidate // Disable built-in browser validation
        >
          {/* Left Form Section */}
          <div className="form-left">
            <div className="form-group">
              <input
                type="text"
                name="username"
                value={values.username}
                onChange={handleInputChange}
                placeholder="Username (must be unique)"
              />
              {errors.username && <div style={{ color: 'red', marginTop: '4px' }}>{errors.username}</div>}
            </div>

            <div className="checkbox-inline">
              <input
                id="pokemonGoNameDisabled"
                type="checkbox"
                name="pokemonGoNameDisabled"
                checked={values.pokemonGoNameDisabled}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="pokemonGoNameDisabled">Username matches my Pokémon GO account name</label>
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleInputChange}
                placeholder="Email (must be unique)"
                required
              />
              {errors.email && <div style={{ color: 'red', marginTop: '4px' }}>{errors.email}</div>}
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                value={values.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
              />
              {errors.password && <div style={{ color: 'red', marginTop: '4px' }}>{errors.password}</div>}
            </div>
          </div>

          {/* Right Form Section */}
          <div className="form-right">
            <div className="form-group">
              <input
                type="text"
                name="pokemonGoName"
                value={values.pokemonGoName}
                onChange={handleInputChange}
                placeholder="Pokémon GO name (optional)"
                disabled={values.pokemonGoNameDisabled}
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="trainerCode"
                value={values.trainerCode}
                onChange={handleInputChange}
                placeholder="Trainer Code (optional)"
              />
              {errors.trainerCode && <div style={{ color: 'red', marginTop: '4px' }}>{errors.trainerCode}</div>}
            </div>

            <div className="checkbox-inline">
              <input
                id="allowLocation"
                type="checkbox"
                name="allowLocation"
                checked={values.allowLocation}
                onChange={handleAllowLocationChange}
              />
              <label htmlFor="allowLocation">Enable collection of your device's GPS location data</label>
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
              <div className="location-warning">
                Modifying this resets coordinates and permissions.
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
            <button className="submit-button" type="submit" data-testid="register-button">
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
      {showOptionsOverlay && (
        <LocationOptionsOverlay
          locations={locationOptions}
          onLocationSelect={handleOverlayLocationSelect}
          onDismiss={() => setShowOptionsOverlay(false)}
        />
      )}
    </div>
  );
};

export default RegisterForm;
