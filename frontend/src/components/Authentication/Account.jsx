// Account.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // ensure path is correct
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm';
import './Account.css';
import { toast } from 'react-toastify';

const Account = () => {
    const { user, updateUserDetails, logout } = useAuth(); // Ensure you destruct `logout` from useAuth
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState('');
    const [errors, setErrors] = useState({});

    if (!user) {
        return <div>Loading user details...</div>;
    }

    const handleUpdateUserDetails = async (userId, userData) => {
        const result = await updateUserDetails(userId, userData);
        if (result.success) {
            toast.success('Account details updated successfully!');
        } else {
            setErrors(prevErrors => ({
                ...prevErrors,
                username: result.error.includes('Username') ? 'This username is already taken.' : '',
                email: result.error.includes('Email') ? 'This email is already in use.' : '',
                pokemonGoName: result.error.includes('Pokémon Go name') ? 'This Pokémon Go name is already taken.' : '',
                trainerCode: result.error.includes('Trainer Code') ? 'This Trainer Code is already in use.' : ''
            }));
            toast.error('Update failed: ' + result.error);
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

    const handleDeleteAccount = () => {
        console.log("Account deletion not implemented yet.");
    };

    return (
        <div className="account-page">
            <AccountForm
                user={user}
                onUpdateUserDetails={handleUpdateUserDetails}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                errors={errors}
            />
            {feedback && <div className="success-message">{feedback}</div>}
        </div>
    );
};

export default Account;