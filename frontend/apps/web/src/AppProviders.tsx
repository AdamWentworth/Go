// AppProviders.tsx

import React, { ReactNode } from 'react';

import { AuthProvider }     from './contexts/AuthContext';
import { EventsProvider }   from './contexts/EventsContext';
import { ThemeProvider }    from './contexts/ThemeContext';
import { ModalProvider }    from './contexts/ModalContext';

/** Wraps the app in context providers only. */
const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>
    <EventsProvider>
        <ThemeProvider>
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
    </EventsProvider>
  </AuthProvider>
);

export default AppProviders;