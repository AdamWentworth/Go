import { useState } from 'react';

const useErrorHandler = <TError = string>() => {
  const [error, setError] = useState<TError | null>(null);

  const handleError = (newError: TError) => {
    setError(newError);
  };

  const clearError = () => {
    setError(null);
  };

  return { error, handleError, clearError };
};

export default useErrorHandler;
