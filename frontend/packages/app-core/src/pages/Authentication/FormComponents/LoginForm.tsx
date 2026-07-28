// LoginForm.tsx

import React, { FC } from 'react';
import {
  GoogleLoginButton,
} from 'react-social-login-buttons';
import './LoginForm.css';

import { useModal } from '../../../contexts/ModalContext';
import type { LoginFormValues } from '../../../types/auth';
import type { FormErrors } from '../../../types/auth';
import { startGoogleAuthentication } from '@/services/authService';
import { startDiscordAuthentication } from '@/services/authService';
import { startFacebookAuthentication } from '@/services/authService';
import { FaDiscord, FaFacebookF } from 'react-icons/fa';

interface LoginFormProps {
  values: LoginFormValues;
  errors: FormErrors;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void; // optional prop for reset password handling
}

const LoginForm: FC<LoginFormProps> = ({
  values,
  errors,
  onChange,
  onSubmit,
  onResetPassword,
}) => {
  const { alert } = useModal();

  const handleResetPassword = () => {
    if (onResetPassword) {
      onResetPassword();
    } else {
      alert('Password Reset is not yet implemented.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-form">
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="username"
            value={values.username}
            onChange={onChange}
            placeholder="Username or Email"
            required
          />
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={onChange}
            placeholder="Password"
            required
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
          {errors.username && <div className="error-message">{errors.username}</div>}
          <button type="submit">Login</button>
          <button
            type="button"
            className="reset-password-button"
            onClick={handleResetPassword}
          >
            Reset Password
          </button>
          <div className="social-login-buttons">
            <GoogleLoginButton onClick={startGoogleAuthentication}>
              Login with Google
            </GoogleLoginButton>
            <button
              type="button"
              className="discord-login-button"
              onClick={() => startDiscordAuthentication('login')}
            >
              <FaDiscord aria-hidden="true" />
              Login with Discord
            </button>
            <button
              type="button"
              className="facebook-login-button"
              onClick={() => startFacebookAuthentication('login')}
            >
              <FaFacebookF aria-hidden="true" />
              Login with Facebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
