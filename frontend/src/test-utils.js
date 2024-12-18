// src/test-utils.js
import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from 'contexts/AuthContext'; // Mapped to mock via moduleNameMapper
import { GlobalStateProvider } from 'contexts/GlobalStateContext'; // Mapped to mock via moduleNameMapper
import { SessionProvider } from 'contexts/SessionContext';
import { PokemonDataProvider } from 'contexts/PokemonDataContext';

const customRender = (ui, options) =>
  render(
    <GlobalStateProvider>
      <SessionProvider>
        <PokemonDataProvider>
          <AuthProvider>
            {ui}
          </AuthProvider>
        </PokemonDataProvider>
      </SessionProvider>
    </GlobalStateProvider>,
    options
  );

export * from '@testing-library/react';
export { customRender as render };
