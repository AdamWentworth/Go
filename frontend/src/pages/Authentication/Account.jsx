// Account.jsx

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm';
import './Account.css';
import { toast } from 'react-toastify';
import ActionMenu from '../../components/ActionMenu'; // Import the reusable ActionMenu

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
                    toast.info('Password was not updated as it is identical to your previous password.');
                } else if (result.data?.passwordUpdated) {
                    toast.success('Account details and password updated successfully!');
                } else {
                    toast.success('Account details updated successfully!');
                }
            } else {
                const errorMessage = typeof result.error === 'string' ? result.error : '';
    
                setErrors(prevErrors => ({
                    ...prevErrors,
                    username: errorMessage.includes('Username') ? 'This username is already taken.' : '',
                    email: errorMessage.includes('Email') ? 'This email is already in use.' : '',
                    pokemonGoName: errorMessage.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
                    trainerCode: errorMessage.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
                }));
                toast.error('Update failed: ' + errorMessage);
                console.error('Update failed:', errorMessage);
    
                if (formRef.current) {
                    formRef.current.resetForm();
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred while updating your details.');
            console.error('Unexpected error during update:', error);
    
            if (formRef.current) {
                formRef.current.resetForm();
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Failed to logout. Please try again.');
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account and all its data?")) {
            try {
                await deleteAccount(user.user_id);
                toast.success('Account deleted successfully');
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
                ref={formRef}
                user={user}
                handleUpdateUserDetails={handleUpdateUserDetails}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                errors={errors}
            />
            {/* Render the ActionMenu component */}
            <ActionMenu />
        </div>
    );
};

export default Account;