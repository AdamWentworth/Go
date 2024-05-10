// RegisterForm.jsx

import React from 'react';
import { GoogleLoginButton, FacebookLoginButton, TwitterLoginButton } from 'react-social-login-buttons';
import './RegisterForm.css';

const RegisterForm = ({
  values,
  errors,
  onChange,
  onSubmit
}) => {
  return (
    <div className="register-page">
      <div className="register-form">
        <form onSubmit={onSubmit}>
          <div className="left-column">
            <input type="text" name="username" value={values.username} onChange={onChange} placeholder="Username (must be unique)" required />
            <div className="checkbox-inline multi-line-checkbox">
              <input type="checkbox" name="pokemonGoNameDisabled" checked={values.pokemonGoNameDisabled} onChange={onChange} />
              <label>Username matches my Pokémon GO account name</label>
            </div>
            <input type="email" name="email" value={values.email} onChange={onChange} placeholder="Email" required />
            <input type="password" name="password" value={values.password} onChange={onChange} placeholder="Password" required />
            {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}
            <div className="location-info">
              <p>Pokémon Go Account and Location details are optional but recommended for enabling location-based features like discovering local opportunities for trades.</p>
            </div>
          </div>
          <div className="right-column">
            <input type="text" name="pokemonGoName" value={values.pokemonGoName} onChange={onChange} placeholder="Pokémon GO name (optional)" disabled={values.pokemonGoNameDisabled} />
            <input type="text" name="trainerCode" value={values.trainerCode} onChange={onChange} placeholder="Trainer Code (optional)" />
            {errors.trainerCode && <div style={{ color: 'red' }}>{errors.trainerCode}</div>}
            <div className="checkbox-inline multi-line-checkbox">
              <input type="checkbox" name="allowLocation" checked={values.allowLocation} onChange={onChange} />
              <label>Enable collection of your device's GPS location data</label>
            </div>
            <input type="text" name="country" value={values.country} onChange={onChange} placeholder="Country (optional)" />
            <input type="text" name="city" value={values.city} onChange={onChange} placeholder="City (optional)" />
          </div>
          <button type="submit">Register</button>
          <div className="social-login-buttons">
            <GoogleLoginButton onClick={() => window.location.href = 'http://localhost:3003/auth/google'}>
                Register with Google
            </GoogleLoginButton>
            <FacebookLoginButton onClick={() => console.log("Facebook login")}>Register with Facebook</FacebookLoginButton>
            <TwitterLoginButton onClick={() => console.log("Twitter login")}>Register with Twitter</TwitterLoginButton>
            <button className="discord-button" onClick={() => console.log("Discord login")}>
              <img src="images/discord_icon.png" alt="Discord" />
              Register with Discord
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
