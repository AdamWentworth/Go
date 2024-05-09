// AccountForm.jsx
import React, { useState } from 'react';
import useForm from '../hooks/useForm';  // Ensure the path to useForm is correct
import './AccountForm.css';

const AccountForm = ({ user, onUpdateUserDetails, onLogout, onDeleteAccount }) => {
    const [isEditable, setIsEditable] = useState(false); // State to control edit mode

    // Define onSubmit before passing it to useForm
    const onSubmit = values => {
        if (isEditable) {  // Only update if we are in edit mode
            onUpdateUserDetails(user.user_id, values).then(() => {
                console.log("Account details updated:", values);
                setIsEditable(false);  // Toggle edit mode off after submission
            }).catch(error => {
                console.error("Failed to update account details:", error);
            });
        }
    };

    const { values, handleChange, handleSubmit } = useForm({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      password: '',
      pokemonGoName: user.pokemonGoName || '',
      trainerCode: user.trainerCode || '',
      country: user.country || '',
      city: user.city || '',
      allowLocation: user.allowLocation || false,
      pokemonGoNameDisabled: user.pokemonGoName === user.username
    }, onSubmit, 'edit');

    const handleEditToggle = (e) => {
        e.preventDefault(); // Ensure default action is prevented
        setIsEditable(!isEditable); // Toggle edit mode
    };

    return (
        <form onSubmit={handleSubmit} className="account-form">
            <h1>Account Details</h1>
            <div className="user-details">
                <div className="left-column">
                    <label>Username:
                        <input type="text" name="username" value={values.username} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label className="checkbox-inline">Username matches my Pokémon GO account name
                        <input type="checkbox" name="pokemonGoNameDisabled" checked={values.pokemonGoNameDisabled} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label>Email:
                        <input type="email" name="email" value={values.email} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label>Change Password:
                        <input type="password" name="password" value={values.password} onChange={handleChange} placeholder="New Password" disabled={!isEditable} />
                    </label>
                    <label>Confirm Change Password:
                        <input type="password" name="password" value={values.password} onChange={handleChange} placeholder="Confirm New Password" disabled={!isEditable} />
                    </label>
                </div>
                <div className="right-column">
                    <label>Pokémon Go Name:
                        <input type="text" name="pokemonGoName" value={values.pokemonGoName} onChange={handleChange} disabled={!isEditable || values.pokemonGoNameDisabled} />
                    </label>
                    <label>Trainer Code:
                        <input type="text" name="trainerCode" value={values.trainerCode} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label className="checkbox-inline">Enable collection of your device's GPS location data
                        <input type="checkbox" name="allowLocation" checked={values.allowLocation} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label>Country:
                        <input type="text" name="country" value={values.country} onChange={handleChange} disabled={!isEditable || values.allowLocation} />
                    </label>
                    <label>City:
                        <input type="text" name="city" value={values.city} onChange={handleChange} disabled={!isEditable || values.allowLocation} />
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
    );
};

export default AccountForm;
