// AccountForm.jsx
import React, { useState } from 'react';
import useForm from '../hooks/useForm'; // Ensure the path to useForm is correct
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AccountForm.css';

const AccountForm = ({ user, onUpdateUserDetails, onLogout, onDeleteAccount }) => {
    const [isEditable, setIsEditable] = useState(false);

    const onSubmit = values => {
        if (isEditable) {
            // Ensure trainerCode is submitted without spaces
            const submissionValues = {
                ...values,
                trainerCode: values.trainerCode.replace(/\s+/g, ''),
            };
            onUpdateUserDetails(user.user_id, submissionValues).then(() => {
                toast.success("Account details updated successfully!");
                setIsEditable(false);
            }).catch(error => {
                toast.error("Failed to update account details: " + error.message);
            });
        }
    };

    const { values, errors, handleChange, handleSubmit } = useForm({
        userId: user.user_id,
        username: user.username,
        email: user.email,
        password: '',
        pokemonGoName: user.pokemonGoName || '',
        trainerCode: user.trainerCode ? user.trainerCode.replace(/(\d{4})(?=\d)/g, "$1 ") : '', // Format with spaces for display
        country: user.country || '',
        city: user.city || '',
        allowLocation: user.allowLocation || false,
        pokemonGoNameDisabled: user.pokemonGoName === user.username
    }, onSubmit, 'edit');

    const handleEditToggle = (e) => {
        e.preventDefault();
        setIsEditable(!isEditable);
    };

    return (
        <form onSubmit={handleSubmit} className="account-form">
            <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <h1>Account Details</h1>
            <div className="user-details">
                <div className="left-column">
                    <label>Username:
                        <input type="text" name="username" value={values.username} onChange={handleChange} disabled={!isEditable} />
                        {errors.username && <div className="error">{errors.username}</div>}
                    </label>
                    <label className="checkbox-inline">Username matches my Pokémon GO account name
                        <input type="checkbox" name="pokemonGoNameDisabled" checked={values.pokemonGoNameDisabled} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label>Email:
                        <input type="email" name="email" value={values.email} onChange={handleChange} disabled={!isEditable} />
                        {errors.email && <div className="error">{errors.email}</div>}
                    </label>
                    <label>Change Password:
                        <input type="password" name="password" value={values.password} onChange={handleChange} placeholder="New Password" disabled={!isEditable} />
                        {errors.password && <div className="error">{errors.password}</div>}
                    </label>
                    <label>Confirm Change Password:
                        <input type="password" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} placeholder="Confirm New Password" disabled={!isEditable} />
                        {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
                    </label>
                </div>
                <div className="right-column">
                    <label>Pokémon Go Name:
                        <input type="text" name="pokemonGoName" value={values.pokemonGoName} onChange={handleChange} disabled={!isEditable || values.pokemonGoNameDisabled} />
                        {errors.pokemonGoName && <div className="error">{errors.pokemonGoName}</div>}
                    </label>
                    <label>Trainer Code:
                        <input type="text" name="trainerCode" value={values.trainerCode} onChange={handleChange} disabled={!isEditable} />
                        {errors.trainerCode && <div className="error">{errors.trainerCode}</div>}
                    </label>
                    <label className="checkbox-inline">Enable collection of your device's GPS location data
                        <input type="checkbox" name="allowLocation" checked={values.allowLocation} onChange={handleChange} disabled={!isEditable} />
                    </label>
                    <label>Country:
                        <input type="text" name="country" value={values.country} onChange={handleChange} />
                        {errors.country && <div className="error">{errors.country}</div>}
                    </label>
                    <label>City:
                        <input type="text" name="city" value={values.city} onChange={handleChange} />
                        {errors.city && <div className="error">{errors.city}</div>}
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
