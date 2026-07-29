// ResetPasswordOverlay.tsx

import { useState, FC, ChangeEvent, FormEvent } from 'react';
import { FaEnvelope, FaKey } from 'react-icons/fa';
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
      toast.success('If that account exists, reset instructions are on the way.');
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
    <div className="reset-password-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="overlay-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-button" aria-label="Close password reset" onClick={onClose}>
          &times;
        </button>
        <div className="reset-password-overlay__icon"><FaKey /></div>
        <span className="reset-password-overlay__eyebrow">Account recovery</span>
        <h2 id="reset-password-title">Reset your password</h2>
        <p>
          Enter the username or email attached to your account. We’ll email a
          secure, single-use link that expires after 30 minutes.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            <span><FaEnvelope /> Username or email</span>
            <input
              autoFocus
              type="text"
              name="identifier"
              value={input}
              onChange={handleChange}
              autoComplete="username"
              placeholder="you@example.com"
              required
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Email reset link'}
          </button>
        </form>
        <small>
          For your privacy, we show the same confirmation whether or not an
          account matches what you entered.
        </small>
      </section>
    </div>
  );
};

export default ResetPasswordOverlay;
