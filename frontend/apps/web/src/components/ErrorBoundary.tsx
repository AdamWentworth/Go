import React, { Component, type ErrorInfo, type ReactNode } from 'react';

import { logAppError } from '@/utils/errorLogging';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logAppError(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app-error-fallback" role="alert" aria-live="assertive">
          <h2>Something went wrong</h2>
          <p>Please try again. If it keeps happening, reload the page.</p>
          <div className="app-error-actions">
            <button type="button" onClick={this.handleRetry}>
              Try Again
            </button>
            <button type="button" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

