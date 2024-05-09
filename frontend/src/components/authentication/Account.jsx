// Account.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm'; // Assuming this is the correct path
import './Account.css'

const Account = () => {
    const { user, logout, updateUserDetails } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return <div>Loading user details...</div>;
    }

    const handleLogout = () => {
        logout(); // This now clears the local storage
        navigate('/login'); // Redirect to login page after logout
    };

    const handleDeleteAccount = () => {
        console.log("Account deletion not implemented yet.");
    };

    return (
        <div className="account-page">
            <AccountForm
                user={user}
                onUpdateUserDetails={updateUserDetails}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
            />
        </div>
    );
};

export default Account;
