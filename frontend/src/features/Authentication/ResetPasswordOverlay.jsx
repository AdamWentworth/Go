// src/components/ResetPasswordOverlay.jsx

import React, { useState } from 'react';
import './ResetPasswordOverlay.css'; // You'll create this CSS file for styling
import { resetPassword } from '../../services/authService'; // Ensure you have this method in authService.js
import { toast } from 'react-toastify';

const ResetPasswordOverlay = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input) {
      toast.error('Please enter your username or email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ identifier: input });
      toast.success('Password reset instructions have been sent to your email.');
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-overlay">
      <div className="overlay-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="identifier"
            value={input}
            onChange={handleChange}
            placeholder="Username or Email"
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordOverlay;
