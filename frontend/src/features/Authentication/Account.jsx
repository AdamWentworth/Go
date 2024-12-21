// Account.jsx

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm';
import './Account.css';
import { toast } from 'react-toastify';

const Account = () => {
    const { user, updateUserDetails, logout, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const formRef = useRef(); // Create a ref to access AccountForm's resetForm

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
    
                // Check if password was submitted and not updated
                if (userData.password && !result.data?.passwordUpdated) { 
                    // Notify the user that the password was not changed
                    toast.info('Password was not updated as it is identical to your previous password.');
                } else if (result.data?.passwordUpdated) {
                    // Notify the user that both account details and password were updated
                    toast.success('Account details and password updated successfully!');
                } else {
                    // If password wasn't submitted, only notify about account details
                    toast.success('Account details updated successfully!');
                }
            } else {
                // Ensure result.error is a string before calling includes
                const errorMessage = typeof result.error === 'string' ? result.error : '';
    
                // Handle validation errors
                setErrors(prevErrors => ({
                    ...prevErrors,
                    username: errorMessage.includes('Username') ? 'This username is already taken.' : '',
                    email: errorMessage.includes('Email') ? 'This email is already in use.' : '',
                    pokemonGoName: errorMessage.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
                    trainerCode: errorMessage.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
                }));
                toast.error('Update failed: ' + errorMessage);
                console.error('Update failed:', errorMessage);
    
                // Reset the form fields to user details as if remounted
                if (formRef.current) {
                    formRef.current.resetForm();
                }
            }
        } catch (error) {
            // Handle unexpected errors
            toast.error('An unexpected error occurred while updating your details.');
            console.error('Unexpected error during update:', error);
    
            // Reset the form fields to user details as if remounted
            if (formRef.current) {
                formRef.current.resetForm();
            }
        }
    };    

    const handleLogout = async () => {
        try {
            await logout(); // Correctly call logout from useAuth
            navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Failed to logout. Please try again.');
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
                ref={formRef} // Attach the ref to AccountForm
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
