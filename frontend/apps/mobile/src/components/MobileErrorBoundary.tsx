import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { reportCrash } from '../observability/crashReporter';
import { theme } from '../ui/theme';

type MobileErrorBoundaryProps = {
  children: ReactNode;
};

type MobileErrorBoundaryState = {
  hasError: boolean;
};

export class MobileErrorBoundary extends Component<
  MobileErrorBoundaryProps,
  MobileErrorBoundaryState
> {
  state: MobileErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): MobileErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    void reportCrash('react_error_boundary', error, {
      fatal: true,
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong.</Text>
        <Text style={styles.subtitle}>
          The app encountered an unexpected error. Try again.
        </Text>
        <Button title="Try Again" onPress={this.retry} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.type.title,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
