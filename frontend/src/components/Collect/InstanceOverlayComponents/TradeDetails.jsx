// TradeDetails.jsx
import React from 'react';
import './TradeDetails.css';

const TradeDetails = ({ pokemon }) => {
    const { friendship_level, mirror, trade_list } = pokemon.ownershipStatus;

    // Function to render trade list details or a placeholder if empty
    const renderTradeListDetails = () => {
        const keys = Object.keys(trade_list);
        if (keys.length === 0) {
            return "No trades listed."; // Or any other placeholder text
        }
        return keys.map(key => (
            <div key={key}>
                {key}: {trade_list[key]}
            </div>
        ));
    };

    return (
        <div className="trade-details-container">
            <h2>Trade Details</h2>
            <p><strong>Friendship Level:</strong> {friendship_level}</p>
            <p><strong>Mirror Status:</strong> {mirror ? "Yes" : "No"}</p>
            <div><strong>Trade List:</strong> {renderTradeListDetails()}</div>
        </div>
    );
};

export default TradeDetails;
