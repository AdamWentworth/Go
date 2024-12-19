// src/mocks/services/authService.js

export const logoutUser = jest.fn(() => Promise.resolve());

export const updateUserDetails = jest.fn(() => Promise.resolve({ 
  success: true, 
  data: {} 
}));

export const deleteAccount = jest.fn(() => Promise.resolve());

export const refreshTokenService = jest.fn(() => Promise.resolve({
  accessTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  refreshTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
}));

export const registerUser = async (userData) => {
  const response = await fetch(`${process.env.REACT_APP_AUTH_API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const loginUser = jest.fn(() => Promise.resolve({
  user_id: 1,
  email: 'test@example.com',
  username: 'TestUser',
  pokemonGoName: 'TestPokemonTrainer',
  trainerCode: '123456789012',
  allowLocation: false,
  country: 'Test Country',
  city: 'Test City',
  accessTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  refreshTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
}));

export const fetchOwnershipData = jest.fn(() => Promise.resolve({}));

export const googleLogin = jest.fn(() => Promise.resolve({
  user_id: 1,
  email: 'google-user@example.com',
  username: 'GoogleUser',
  accessToken: 'mock-google-access-token'
}));

export const facebookLogin = jest.fn(() => Promise.resolve({
  user_id: 1,
  email: 'facebook-user@example.com',
  username: 'FacebookUser',
  accessToken: 'mock-facebook-access-token'
}));

export const twitterLogin = jest.fn(() => Promise.resolve({
  user_id: 1,
  email: 'twitter-user@example.com',
  username: 'TwitterUser',
  accessToken: 'mock-twitter-access-token'
}));

export default {
  logoutUser,
  updateUserDetails,
  deleteAccount,
  refreshTokenService,
  registerUser,
  loginUser,
  fetchOwnershipData,
  googleLogin,
  facebookLogin,
  twitterLogin
};