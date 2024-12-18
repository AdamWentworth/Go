// src/mocks/react-toastify.js
import React from 'react';

// Mock ToastContainer as a simple div
export const ToastContainer = () => <div />;

// Mock other exports from react-toastify as needed
export const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Add other methods if your components use them
};
