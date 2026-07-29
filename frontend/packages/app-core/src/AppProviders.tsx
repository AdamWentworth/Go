// AppProviders.tsx

import React, { ReactNode } from 'react';

import { AuthProvider }     from './contexts/AuthContext';
import { EventsProvider }   from './contexts/EventsContext';
import { ThemeProvider }    from './contexts/ThemeContext';
import { ModalProvider }    from './contexts/ModalContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';

/** Wraps the app in context providers only. */
const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EventsProvider>
          <ThemeProvider>
            <ModalProvider>{children}</ModalProvider>
          </ThemeProvider>
      </EventsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppProviders;
