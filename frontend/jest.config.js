// jest.config.js
module.exports = {
    testEnvironment: 'jest-fixed-jsdom',
    testEnvironmentOptions: {
      customExportConditions: [''],
    },
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // Ensure this line is present
  };
  
  