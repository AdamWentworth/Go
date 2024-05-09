// SuccessMessage.jsx

import React from 'react';
import './SuccessMessage.css'; // Ensure the CSS file is created

const SuccessMessage = ({ mainMessage, detailMessage }) => {
    return (
        <div className="success-container">
            <h1>{mainMessage}</h1>
            <p>{detailMessage}</p>
        </div>
    );
}

export default SuccessMessage;
