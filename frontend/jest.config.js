// jest.config.js
module.exports = {

  testEnvironmentOptions: {
    customExportConditions: [''],
  },

  // Specify the test environment
  testEnvironment: 'jest-fixed-jsdom',

  // Transform settings
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Adjust transformIgnorePatterns to exclude both 'ol' and 'rbush'
  transformIgnorePatterns: [
    "/node_modules/(?!(ol|rbush|uuid)/)"
  ],

  // Module name mappings for handling CSS and other assets
  moduleNameMapper: {
    // Handle CSS imports (including CSS modules)
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',

    // Mock other asset types like images and fonts
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/mocks/fileMock.js',

    '^ol/(.*)$': '<rootDir>/src/mocks/ol.js',

    '<rootDir>/contexts/AuthContext$': '<rootDir>/src/mocks/contexts/AuthContext.js',
    '<rootDir>/contexts/GlobalStateContext$': '<rootDir>/src/mocks/contexts/GlobalStateContext.js',
    '<rootDir>/contexts/SessionContext$': '<rootDir>/src/mocks/contexts/SessionContext.js',
    '<rootDir>/contexts/PokemonDataContext$': '<rootDir>/src/mocks/contexts/PokemonDataContext.js',

    '^react-router-dom$': '<rootDir>/src/mocks/react-router-dom.js',
    '^react-toastify$': '<rootDir>/src/mocks/react-toastify.js',

    '^utils/deviceID$': '<rootDir>/src/mocks/utils/deviceID.js',
    '^utils/formattingHelpers$': '<rootDir>/src/mocks/utils/formattingHelpers.js',

    '^services/authService$': '<rootDir>/src/mocks/services/authService.js',
    '^services/sseService$': '<rootDir>/src/mocks/services/sseService.js',
    '^services/indexedDB$': '<rootDir>/src/mocks/services/indexedDB.js',

    '^features/Register$': '<rootDir>/src/mocks/features/Register.js',
  },

  moduleDirectories: ['node_modules', 'src'],

  // Setup files after environment is set up
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};
  
  