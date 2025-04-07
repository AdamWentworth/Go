# Pokémon Go Nexus Authentication Service

This service handles user registration, login, secure token-based authentication, refresh logic, and account management for the Pokémon Go Nexus ecosystem.

## 🔐 Overview

It manages:
- Secure password hashing with `bcrypt`
- JWT access and refresh tokens (stored per-device)
- CORS and cookie-based token delivery
- User updates, logout, and password reset flows
- A rotating backup system for user records

> 🧠 **Note:** This service is designed to support multiple user devices and sessions, and implements refresh token cleanup and token reuse prevention.

---

## 📁 Project Structure

```plaintext
authentication/
├── .env.*                  # Environment configs
├── app.js                  # Express app entry point
├── backups/                # Rotating gzipped MongoDB backups
├── config/                 # YAML-based app and logging config
├── middlewares/            # Express middleware (logging, cookies, DB)
├── models/                 # Mongoose models
├── routes/                 # Express routes for authentication
├── services/               # Token and email logic
├── strategies/             # Passport setup
├── tasks/                  # Backup and manual scripts
├── utils/                  # Utility functions (e.g. token sanitizing)
└── package.json            # Project dependencies
```

<!-- 💡 Suggestion: Consider adding where the Mongo connection is initialized (likely in mongoose.js), and whether any admin scripts exist for batch cleanup. -->

---

## 🚀 Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Environment setup**

Create a `.env.development` file (or use the existing one) and configure the following environment variables:

| Key               | Required | Description                                                                 |
|--------------------|----------|-----------------------------------------------------------------------------|
| `NODE_ENV`         | ✅       | Set to `development` or `production`                                       |
| `DATABASE_URL`     | ✅       | MongoDB connection string                                                  |
| `JWT_SECRET`       | ✅       | Used to sign and verify JWT access and refresh tokens                      |
| `SESSION_SECRET`   | ✅       | Secret used by `express-session` to manage session integrity               |
| `FRONTEND_URL`     | ✅       | Used for setting CORS and cookie domain behavior (e.g. `http://localhost:3000`) |

These are the only environment variables required for the current server functionality.

> 💡 You can safely ignore or remove any unused keys like `EMAIL_USER`, `EMAIL_PASS`, or `GOOGLE_CLIENT_ID` — they aren’t active in this service yet.


3. **Run the server**
   ```bash
   npm start
   ```

The server's package.json is configured to run with nodemon, so you don’t need to run nodemon manually.

---

## 🔑 Authentication Flows

### 📥 Register

```
POST /register
```

Registers a user with:
- `username`
- `email`
- Optional: `pokemonGoName`, `trainerCode`, `location`, `coordinates`

- Checks uniqueness for all identifying fields
- Passwords are securely hashed
- Tokens are returned and stored in cookies

### 🔓 Login

```
POST /login
```

Login using either `username` or `email` with password.

- Device ID required (to track token uniqueness)
- Old tokens for the same device are revoked before adding new ones

### 🔄 Refresh Token

```
POST /refresh
```

- Requires a valid `refreshToken` cookie
- Creates a new access token for an existing valid session
- Rejects expired or revoked tokens

---

## ⚙️ Additional Routes

### 🛠 Update User

```
PUT /update/:id
```

- Accepts most fields including password (auto-hashed if different)
- Checks for duplicates in key fields
- Rejects updates to token expiry fields

### ❌ Delete User

```
DELETE /delete/:id
```

Deletes a user by their ID.

### 🚪 Logout

```
POST /logout
```

Removes the refresh token tied to the current session/device. Clears cookies.

### 🔁 Reset Password

```
POST /reset-password/
```

- Uses a password reset token (via email flow)
- Hashes and saves the new password

*This is currently not in use as the frontend blocks hitting this endpoint. There is not yet a password reset email so we do not yet have password resetting*

### 🤝 Reveal Trade Partner Info

```
POST /reveal-partner-info
```

Used during a trade between users to **reveal the partner’s trainer code, Pokémon Go name, and location**.

- Requires the access token via cookie
- Accepts a `trade` object in the request body (including both usernames)
- Confirms that the requester is part of the trade before revealing the other player’s info

Returns:
```json
{
  "trainerCode": "1234 5678 9012",
  "pokemonGoName": "TrainerName",
  "location": "City, State",
  "coordinates": {
    "latitude": 12.34,
    "longitude": 56.78
  }
}
```

---

## 📦 Backup System

The `backups/` folder contains daily gzipped MongoDB exports that backup at midnight.

> These are generated via `tasks/backup.js`.  
> Files are named using the format: `PoGo_App_Users_YYYY_MM_DD.gz`

---

## 🔐 Token Strategy

Tokens are generated per device:

- `accessToken`: Short-lived, returned in response
- `refreshToken`: Stored in user DB entry and cookie, rotated per login or refresh
- Multiple tokens can exist per user but are cleaned per device or on expiration

> On login or refresh, tokens with expired timestamps or matching `device_id` are pruned before inserting a new one.

---

## 📄 OpenAPI & Swagger

The API is documented (but may not be up-to-date):

```
GET /api-docs
```

Spec file is found at:
```
config/openapi.yml
```

---

## 🧠 Notes

- The `sanitizeLogging.js` util helps avoid logging sensitive data
- `mongoose.js` handles DB connection and is reused across services
- Passport is configured but not heavily used beyond token handling

---

## 🧭 Future Work

- Password Resetting
- Auth0 Logins and Registrations

---

## 👨‍💻 Author Notes

This service powers the authentication for the Pokémon Go Nexus app and website. It was designed to scale securely across devices while staying flexible for frontend needs. While it works as-is, future optimization around token/session cleanup, rate limiting, and abuse prevention may be needed as the userbase grows.
