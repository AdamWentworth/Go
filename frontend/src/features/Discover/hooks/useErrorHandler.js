// hooks/useErrorHandler.js

import { useState } from 'react';

const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = (newError) => {
    setError(newError);
  };

  const clearError = () => {
    setError(null);
  };

  return { error, handleError, clearError };
};

export default useErrorHandler;
