// Account.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Account.css';

const Account = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditable, setIsEditable] = useState(false);
    const [password, setPassword] = useState('');
    const [allowLocation, setAllowLocation] = useState(user?.allowLocation || false);

    if (!user) {
        return <div>Loading user details...</div>;
    }

    const handleEditToggle = () => setIsEditable(!isEditable);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteAccount = () => {
        console.log("Account deletion not implemented yet.");
    };

    const formatTrainerCode = (code) => {
        return code ? code.match(/.{1,4}/g).join(' ') : 'Not set';
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    return (
        <div className="account-page">
            <h1>Account Details</h1>
            <div className="user-details">
                <div className="left-column">
                    <label>
                        Username:
                        <input type="text" value={user.username} disabled={!isEditable} />
                    </label>
                    <label>
                        Email:
                        <input type="email" value={user.email} disabled={!isEditable} />
                    </label>
                    <label>
                        Change Password:
                        <input type="password" value={password} onChange={handlePasswordChange} disabled={!isEditable} placeholder="New Password" />
                    </label>
                    <label>
                        Confirm Change Password:
                        <input type="password" value={password} onChange={handlePasswordChange} disabled={!isEditable} placeholder="New Password" />
                    </label>
                </div>
                <div className="right-column">
                    <label>
                        Pokémon Go Name:
                        <input type="text" value={user.pokemonGoName || ''} disabled={!isEditable} />
                    </label>
                    <label>
                        Trainer Code:
                        <input type="text" value={formatTrainerCode(user.trainerCode)} disabled={!isEditable} />
                    </label>
                    <label>
                        Allow Location:
                        <input type="checkbox" checked={allowLocation} onChange={() => setAllowLocation(!allowLocation)} disabled={!isEditable} />
                    </label>
                    <label>
                        Country:
                        <input type="text" value={user.country || ''} disabled={!isEditable || allowLocation} />
                    </label>
                    <label>
                        City:
                        <input type="text" value={user.city || ''} disabled={!isEditable || allowLocation} />
                    </label>
                </div>
            </div>
            <div className="buttons">
                <button className="edit-btn" onClick={handleEditToggle}>{isEditable ? 'Save Changes' : 'Edit Details'}</button>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
                <button className="delete-btn" onClick={handleDeleteAccount}>Delete Account and Data</button>
            </div>
        </div>
    );
};

export default Account;

