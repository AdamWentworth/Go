import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';

// Register the service worker from the build output (sw.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);

        // Wait until the service worker is ready/active
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.postMessage({
              type: 'SET_CONFIG',
              payload: {
                // Note: process.env.REACT_APP_RECEIVER_API_URL is injected at build time.
                RECEIVER_API_URL: process.env.REACT_APP_RECEIVER_API_URL,
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
const root = createRoot(container);
root.render(<App />);
reportWebVitals();
