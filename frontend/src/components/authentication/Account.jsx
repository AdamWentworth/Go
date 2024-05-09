// Account.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountForm from './FormComponents/AccountForm'; // Assuming this is the correct path
import './Account.css';
import { logoutUser } from './services/authService'; // Only import what's necessary

const Account = () => {
    const { user, updateUserDetails } = useAuth(); // Using from context
    const navigate = useNavigate();

    if (!user) {
        return <div>Loading user details...</div>;
    }

    const handleUpdateUserDetails = async (userId, userData) => {
        try {
            const updatedData = await updateUserDetails(userId, userData);
            console.log("Updated user data:", updatedData);
        } catch (error) {
            console.error("Error updating user details:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser(); // Directly call the imported function
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
            />
        </div>
    );
};

export default Account;