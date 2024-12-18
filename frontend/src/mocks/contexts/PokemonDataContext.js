// src/mocks/contexts/PokemonDataContext.js
import React, { createContext } from 'react';

const PokemonDataContext = createContext();

const mockSetOwnershipData = jest.fn();
const mockResetData = jest.fn();
// Add any additional mock functions as needed
const mockUpdateOwnership = jest.fn();
const mockUpdateLists = jest.fn();
const mockUpdateDetails = jest.fn();

const mockPokemonDataState = {
  ownershipData: {},
  setOwnershipData: mockSetOwnershipData,
  resetData: mockResetData,
  // Add any additional properties/functions your components rely on
  updateOwnership: mockUpdateOwnership,
  updateLists: mockUpdateLists,
  updateDetails: mockUpdateDetails,
};

export const PokemonDataProvider = ({ children }) => {
  return (
    <PokemonDataContext.Provider value={mockPokemonDataState}>
      {children}
    </PokemonDataContext.Provider>
  );
};

export const usePokemonData = () => React.useContext(PokemonDataContext);
