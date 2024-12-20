// AccountForm.jsx

import React from 'react';
import useAccountForm from '../hooks/useAccountForm'; // Custom hook
import CoordinateSelector from '../CoordinateSelector';
import LocationOptionsOverlay from '../LocationOptionsOverlay';
import './AccountForm.css';

const AccountForm = ({ user, handleUpdateUserDetails, onLogout, onDeleteAccount }) => {
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
        showLocationWarning // Destructured state
    } = useAccountForm(user, handleUpdateUserDetails);

    if (!user) {
        return <div>Please log in to view and edit account details.</div>;
    }

    return (
        <div className="account-page">
            <form onSubmit={handleSubmit} className="account-form">
                <h1>Account Details</h1>
                <div className="user-details">
                    {/* Left Column Items */}
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
                                id="pokemonGoNameDisabled" // Added id for accessibility
                                name="pokemonGoNameDisabled" 
                                checked={values.pokemonGoNameDisabled} 
                                onChange={handleChange} 
                                disabled={!isEditable} 
                            />
                            <label htmlFor="pokemonGoNameDisabled">Username matches my Pokémon GO account name</label>
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

                    {/* Right Column Items */}
                    <div className="right-column">
                        <label className="grid-item pokemon-go-name">
                            Pokémon Go Name:
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
                                id="allowLocation" // Added id for accessibility
                                name="allowLocation" 
                                checked={values.allowLocation} 
                                onChange={handleAllowLocationChange} 
                                disabled={!isEditable} 
                            />
                            <label htmlFor="allowLocation">Enable collection of your device's GPS location data</label>
                        </div>
                        
                        <label className="grid-item coordinates">
                            Coordinates:
                            {isEditable ? (
                                <button 
                                    type="button" 
                                    onClick={() => setIsMapVisible(true)} 
                                    className="set-coordinates-button"
                                >
                                    {selectedCoordinates && selectedCoordinates.latitude && selectedCoordinates.longitude
                                        ? `(${selectedCoordinates.latitude}, ${selectedCoordinates.longitude})`
                                        : 'Set Coordinates'}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    name="coordinates"
                                    value={
                                        selectedCoordinates && selectedCoordinates.latitude && selectedCoordinates.longitude
                                            ? `(${selectedCoordinates.latitude}, ${selectedCoordinates.longitude})`
                                            : prevCoordinates && prevCoordinates.latitude && prevCoordinates.longitude
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
                                {/* Suggestions Dropdown */}
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
                        onClick={(e) => isEditable ? handleSubmit(e) : handleEditToggle(e)}
                        className="edit-btn"
                    >
                        {isEditable ? 'Save Changes' : 'Edit Details'}
                    </button>
                    <button type="button" className="logout-btn" onClick={onLogout}>Logout</button>
                    <button type="button" className="delete-btn" onClick={onDeleteAccount}>Delete Account and Data</button>
                </div>
            </form>

            {/* Coordinate Selector Modal */}
            {isMapVisible && (
                <CoordinateSelector
                    onCoordinatesSelect={handleCoordinatesSelect}
                    onLocationSelect={handleLocationUpdate}
                    onClose={() => setIsMapVisible(false)}
                />
            )}

            {/* Location Options Overlay */}
            {showOptionsOverlay && (
                <LocationOptionsOverlay
                    locations={locationOptions}
                    onLocationSelect={handleOverlayLocationSelect} // Use the correct handler
                    onDismiss={() => setShowOptionsOverlay(false)}
                />
            )}
        </div>
    )
}

export default AccountForm;
