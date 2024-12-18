// babel.config.js

module.exports = {
    presets: [
      '@babel/preset-env', // Add this preset
      ['@babel/preset-react', { runtime: 'automatic' }],
      'react-app', // Optional: Ensure this preset doesn't conflict
    ],
  };
  