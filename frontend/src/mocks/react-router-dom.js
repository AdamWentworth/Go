// src/mocks/react-router-dom.js
import React from 'react';

const mockedNavigate = jest.fn();

export const useNavigate = () => mockedNavigate;

// Mock other exports as needed
export const MemoryRouter = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = ({ element }) => <div>{element}</div>;
