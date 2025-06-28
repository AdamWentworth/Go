// ResetPasswordOverlay.tsx

import { useState, FC, ChangeEvent, FormEvent } from 'react';
import './ResetPasswordOverlay.css';
import { resetPassword } from '../../services/authService';
import { toast } from 'react-toastify';
import { isApiError } from '../../utils/errors';

interface ResetPasswordOverlayProps {
  onClose: () => void;
}

const ResetPasswordOverlay: FC<ResetPasswordOverlayProps> = ({ onClose }) => {
  const [input, setInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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
    } catch (error: unknown) {
      let errorMessage = 'Failed to reset password. Please try again.';

      if (isApiError(error)) {
        errorMessage = error.response.data.message;
      }

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
