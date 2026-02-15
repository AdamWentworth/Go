// AccountForm.tsx

import { forwardRef, useImperativeHandle } from 'react';
import useAccountForm from '../hooks/useAccountForm';
import CoordinateSelector from '../CoordinateSelector';
import LocationOptionsOverlay from '../LocationOptionsOverlay';
import './AccountForm.css';

import type { User } from '../../../types/auth';
import type { AccountFormValues, FormErrors } from '@/types/auth';

interface AccountFormProps {
  user: User | null;
  handleUpdateUserDetails: (
    userId: string,
    newDetails: Partial<AccountFormValues>,
    toggleEdit: (edit: boolean) => void
  ) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  errors?: FormErrors;
}

type AccountFormContentProps = Omit<AccountFormProps, 'user'> & {
  user: User;
};

export interface AccountFormHandle {
  resetForm: () => void;
}

const AccountFormContent = forwardRef<AccountFormHandle, AccountFormContentProps>(
  ({ user, handleUpdateUserDetails, onLogout, onDeleteAccount }, ref) => {
    const {
      values,
      errors,
      handleChange,
      handleSubmit,
      isEditable,
      handleEditToggle,
      isMapVisible,
      setIsMapVisible,
      showOptionsOverlay,
      setShowOptionsOverlay,
      selectedCoordinates,
      prevCoordinates,
      handleCoordinatesSelect,
      handleLocationUpdate,
      handleOverlayLocationSelect,
      handleAllowLocationChange,
      handleLocationInputFocus,
      handleLocationInputBlur,
      suggestions,
      selectSuggestion,
      locationOptions,
      showLocationWarning,
      resetForm,
    } = useAccountForm(user, handleUpdateUserDetails);

    useImperativeHandle(ref, () => ({ resetForm }), [resetForm]);

    return (
      <div className="account-page">
        <form onSubmit={handleSubmit} className="account-form">
          <h1>Account Details</h1>
          <div className="user-details">
            <div className="left-column">
              <label className="grid-item username">
                Username:
                <input
                  type="text"
                  name="username"
                  value={values.username}
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                {errors.username && <div className="error">{errors.username}</div>}
              </label>

              <div className="grid-item checkbox-inline">
                <input
                  type="checkbox"
                  id="pokemonGoNameDisabled"
                  name="pokemonGoNameDisabled"
                  checked={values.pokemonGoNameDisabled}
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                <label htmlFor="pokemonGoNameDisabled">
                  Username matches my Pokemon GO account name
                </label>
              </div>

              <label className="grid-item email">
                Email:
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                {errors.email && <div className="error">{errors.email}</div>}
              </label>

              <label className="grid-item password">
                Change Password:
                <input
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="New Password"
                  disabled={!isEditable}
                />
                {errors.password && <div className="error">{errors.password}</div>}
              </label>

              <label className="grid-item confirm-password">
                Confirm Change Password:
                <input
                  type="password"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm New Password"
                  disabled={!isEditable}
                />
                {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
              </label>
            </div>

            <div className="right-column">
              <label className="grid-item pokemon-go-name">
                Pokemon Go Name:
                <input
                  type="text"
                  name="pokemonGoName"
                  value={values.pokemonGoName}
                  onChange={handleChange}
                  disabled={!isEditable || values.pokemonGoNameDisabled}
                />
                {errors.pokemonGoName && <div className="error">{errors.pokemonGoName}</div>}
              </label>

              <label className="grid-item trainer-code">
                Trainer Code:
                <input
                  type="text"
                  name="trainerCode"
                  value={values.trainerCode}
                  onChange={handleChange}
                  disabled={!isEditable}
                />
                {errors.trainerCode && <div className="error">{errors.trainerCode}</div>}
              </label>

              <div className="grid-item checkbox-inline">
                <input
                  type="checkbox"
                  id="allowLocation"
                  name="allowLocation"
                  checked={values.allowLocation}
                  onChange={handleAllowLocationChange}
                  disabled={!isEditable}
                />
                <label htmlFor="allowLocation">
                  Enable collection of your device&apos;s GPS location data
                </label>
              </div>

              <label className="grid-item coordinates">
                Coordinates:
                {isEditable ? (
                  <button
                    type="button"
                    onClick={() => setIsMapVisible(true)}
                    className="set-coordinates-button"
                  >
                    {selectedCoordinates !== null
                      ? `(${selectedCoordinates.latitude}, ${selectedCoordinates.longitude})`
                      : 'Set Coordinates'}
                  </button>
                ) : (
                  <input
                    type="text"
                    name="coordinates"
                    value={
                      selectedCoordinates !== null
                        ? `(${selectedCoordinates.latitude}, ${selectedCoordinates.longitude})`
                        : prevCoordinates !== null
                          ? `(${prevCoordinates.latitude}, ${prevCoordinates.longitude})`
                          : ''
                    }
                    readOnly
                    placeholder="Coordinates not set"
                    disabled={!isEditable}
                  />
                )}
                {errors.coordinates && <div className="error">{errors.coordinates}</div>}
              </label>

              <label className="grid-item location">
                Location:
                <div className="location-input-wrapper">
                  <input
                    type="text"
                    name="location"
                    value={values.location}
                    onChange={handleChange}
                    onFocus={handleLocationInputFocus}
                    onBlur={handleLocationInputBlur}
                    placeholder="City / Place, State / Province, Country (optional)"
                    disabled={!isEditable}
                  />
                  {showLocationWarning && (
                    <span className="warning-message">
                      Modifying location will reset GPS data collection and coordinates.
                    </span>
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
                {errors.location && <div className="error">{errors.location}</div>}
              </label>
            </div>
          </div>

          <div className="buttons">
            <button
              type="button"
              onClick={(e) => (isEditable ? handleSubmit(e) : handleEditToggle(e))}
              className="edit-btn"
            >
              {isEditable ? 'Save Changes' : 'Edit Details'}
            </button>
            <button type="button" className="logout-btn" onClick={onLogout}>
              Logout
            </button>
            <button type="button" className="delete-btn" onClick={onDeleteAccount}>
              Delete Account and Data
            </button>
          </div>
        </form>

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
  }
);

AccountFormContent.displayName = 'AccountFormContent';

const AccountForm = forwardRef<AccountFormHandle, AccountFormProps>(
  ({ user, handleUpdateUserDetails, onLogout, onDeleteAccount }, ref) => {
    if (!user) {
      return <div>Please log in to view and edit account details.</div>;
    }

    return (
      <AccountFormContent
        ref={ref}
        user={user}
        handleUpdateUserDetails={handleUpdateUserDetails}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
      />
    );
  }
);

AccountForm.displayName = 'AccountForm';

export default AccountForm;
