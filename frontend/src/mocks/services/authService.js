// src/mocks/services/authService.js
export const logoutUser = jest.fn(() => Promise.resolve());
export const updateUserDetails = jest.fn(() => Promise.resolve({ success: true, data: {} }));
export const deleteAccount = jest.fn(() => Promise.resolve());
export const refreshTokenService = jest.fn(() => Promise.resolve({
  accessTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  refreshTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
}));
export const registerUser = jest.fn(() => Promise.resolve());
export const loginUser = jest.fn(() => Promise.resolve());
export const fetchOwnershipData = jest.fn(() => Promise.resolve({}));
