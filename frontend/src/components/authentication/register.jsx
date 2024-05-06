import React, { useState } from 'react';
import './register.css'; // Ensure the CSS file is correctly imported
import { GoogleLoginButton, FacebookLoginButton, TwitterLoginButton } from 'react-social-login-buttons'; // Import social buttons

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [pokemonGoName, setPokemonGoName] = useState('');
  const [pokemonGoNameDisabled, setPokemonGoNameDisabled] = useState(false);
  const [trainerCode, setTrainerCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    setPassword(newPassword);
    if (!validatePassword(newPassword)) {
      setPasswordError('Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!passwordError && email && username && password) {
      onRegister(username, pokemonGoName, trainerCode, email, password, country, city, region);
    }
  };

  return (
    <div className="register-page">
      <div className="register-form">
        <form onSubmit={handleSubmit}>
          <div className="left-column">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (must be unique)" required />
            <div className="checkbox-inline">
              <input type="checkbox" checked={pokemonGoNameDisabled} onChange={(e) => setPokemonGoNameDisabled(e.target.checked)} />
              <label>Username matches my Pokémon GO account name</label>
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={handlePasswordChange} placeholder="Password" required />
            <div className="location-info">
                <p>Pokémon Go Account and Location details are optional but recommended for enabling location-based features like discovering local opportunities for trades.</p>
            </div>
          </div>
          <div className="right-column">
            <input type="text" value={pokemonGoName} onChange={(e) => setPokemonGoName(e.target.value)} placeholder="Pokémon GO name (optional)" disabled={pokemonGoNameDisabled} />
            <input type="text" value={trainerCode} onChange={(e) => setTrainerCode(e.target.value)} placeholder="Trainer Code (optional)" />
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country (optional)" />
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional)" />
            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region/Neighborhood (optional)" />
          </div>
          {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
          <button type="submit">Register</button>
          <div className="social-login-buttons">
            <GoogleLoginButton onClick={() => console.log("Google login")}>Register with Google</GoogleLoginButton>
            <FacebookLoginButton onClick={() => console.log("Facebook login")}>Register with Facebook</FacebookLoginButton>
            <TwitterLoginButton onClick={() => console.log("Twitter login")}>Register with Twitter</TwitterLoginButton>
            <button className="nintendo-button" onClick={() => console.log("Nintendo login")}>
            <img src="images/nintendo_icon.png" alt="Nintendo" />
            Register with Nintendo
            </button>
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

export default Register;
