// index.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initPerfPaintObservers } from './utils/perfTelemetry';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);

        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.postMessage({
              type: 'SET_CONFIG',
              payload: {
                RECEIVER_API_URL: import.meta.env.VITE_RECEIVER_API_URL,
              },
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(<App />);

initPerfPaintObservers();

reportWebVitals();
