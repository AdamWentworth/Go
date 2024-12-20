// Account.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm';
import './Account.css';
import { toast } from 'react-toastify';

const Account = () => {
    const { user, updateUserDetails, logout, deleteAccount } = useAuth(); // Removed clearSession and setIsLoggedIn

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    if (!user) {
        return <div>Loading user details...</div>;
    }

    const handleUpdateUserDetails = async (userId, userData, setIsEditable) => {
        try {
            const result = await updateUserDetails(userId, userData);
            console.log("Update result:", result);

            if (result.success) {
                console.log('Account details updated successfully!');
                setIsEditable(false); // Reset form to non-editable state

                if (!result.passwordUpdated) {
                    // Notify the user that the password was not changed
                    toast.info('Password was not updated as it is identical to your previous password.');
                } else {
                    toast.success('Account details and password updated successfully!');
                }
            } else {
                // Handle validation errors
                setErrors(prevErrors => ({
                    ...prevErrors,
                    username: result.message.includes('Username') ? 'This username is already taken.' : '',
                    email: result.message.includes('Email') ? 'This email is already in use.' : '',
                    pokemonGoName: result.message.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
                    trainerCode: result.message.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
                }));
                toast.error('Update failed: ' + result.message);
                console.error('Update failed:', result.message);
            }
        } catch (error) {
            // Handle unexpected errors
            toast.error('An unexpected error occurred while updating your details.');
            console.error('Unexpected error during update:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout(); // Correctly call logout from useAuth
            navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account and all its data?")) {
            try {
                await deleteAccount(user.user_id);
                // Trigger toast once after successful deletion
                toast.success('Account deleted successfully');
                // Navigation and session clearing are handled in AuthContext
            } catch (error) {
                toast.error('Failed to delete account: ' + error.message);
                console.error('Delete account failed:', error);
            }
        } else {
            toast.info('Account deletion canceled');
        }
    };

    return (
        <div className="account-page">
            <AccountForm
                user={user}
                handleUpdateUserDetails={handleUpdateUserDetails}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                errors={errors}
            />
        </div>
    );
};

export default Account;
