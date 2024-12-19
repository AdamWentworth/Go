// ErrorBoundary.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ErrorBoundary.css'; // Optional: For styling the fallback UI

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("Error Boundary Caught an Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>We're sorry for the inconvenience. Please try refreshing the page or navigate back to the home page.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
          <button onClick={() => window.location.href = '/'}>Go to Home</button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
