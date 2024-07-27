// Pagination.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.css';

function Pagination({ currentPage, totalPages, onPageChange }) {
    const pageNumbers = [];
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage || i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pageNumbers.push(i);
        }
    }

    return (
        <div className="pagination">
            <button onClick={() => onPageChange(Math.max(currentPage - 1, 0))} disabled={currentPage === 0}>Previous</button>
            {pageNumbers.map(number => (
                <button 
                    key={number} 
                    onClick={() => onPageChange(number)}
                    className={currentPage === number ? 'active' : ''}
                    disabled={currentPage === number}
                >
                    {number + 1}
                </button>
            ))}
            <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))} disabled={currentPage === totalPages - 1}>Next</button>
        </div>
    );
}

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired
};

export default Pagination;
