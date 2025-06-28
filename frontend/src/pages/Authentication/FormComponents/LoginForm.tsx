// LoginForm.tsx

import React, { FC } from 'react';
import {
  GoogleLoginButton,
  FacebookLoginButton,
  TwitterLoginButton,
  DiscordLoginButton,
} from 'react-social-login-buttons';
import './LoginForm.css';

import { useModal } from '../../../contexts/ModalContext';
import type { LoginFormValues } from '../../../types/auth';
import type { FormErrors } from '../../../types/account';

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
            <GoogleLoginButton onClick={() => alert('Google login is not yet implemented.')}>
              Login with Google
            </GoogleLoginButton>
            <FacebookLoginButton onClick={() => alert('Facebook login is not yet implemented.')}>
              Login with Facebook
            </FacebookLoginButton>
            <TwitterLoginButton onClick={() => alert('Twitter login is not yet implemented.')}>
              Login with Twitter
            </TwitterLoginButton>
            <DiscordLoginButton onClick={() => alert('Discord login is not yet implemented.')}>
              Login with Discord
            </DiscordLoginButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
