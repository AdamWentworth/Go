// SuccessMessage.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SuccessMessage.css'; // Ensure the CSS file is created

const SuccessMessage = ({ mainMessage, detailMessage }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000); // 3 seconds delay

        return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
    }, [navigate]);

    return (
        <div className="success-container">
            <h1>{mainMessage}</h1>
            <p>{detailMessage}</p>
        </div>
    );
}

export default SuccessMessage;