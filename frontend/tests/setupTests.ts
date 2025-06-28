// tests/setupTests.ts
import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, beforeEach, vi, Mock } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { configureAxe, axe, JestAxeConfigureOptions } from 'jest-axe';
import type { AxeResults, Result as AxeResult, NodeResult } from 'axe-core';
import chalk from 'chalk';

// Test Logger Configuration
type LogLevel = 'silent' | 'normal' | 'verbose';
let currentLogLevel: LogLevel = 'normal';

export const testLogger = {
  fileStart: (name: string) => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.cyan(`\n📁 File: ${name}`));
  },
  fileEnd: () => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.cyan('📁 End of File Tests\n'));
  },
  suiteStart: (name: string) => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.yellow(`\n📦 Suite: ${name}`));
  },
  suiteComplete: () => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.yellow('📦 Suite Complete\n'));
  },
  testStep: (step: string) => {
    if (currentLogLevel !== 'verbose') return;
    console.log(chalk.blue(`  ▶ ${step}`));
  },
  assertion: (message: string) => {
    if (currentLogLevel !== 'verbose') return;
    console.log(chalk.green(`    ✓ ${message}`));
  },
  metric: (name: string, value: string | number) => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.magenta(`    📊 ${name}: ${value}`));
  },
  errorDetail: (error: unknown) => {
    if (currentLogLevel === 'silent') return;
    console.error(chalk.red('    ❌ Error Details:'));
    console.error(chalk.red(`      ${error instanceof Error ? error.message : String(error)}`));
  },
  complete: (name: string, duration: number) => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.green(`\n✅ ${name} completed in ${duration}ms\n`));
  },
  fileSeparator: () => {
    if (currentLogLevel === 'silent') return;
    console.log(chalk.gray('────────────────────────────────────────────'));
  },
};

export const enableLogging = (level: LogLevel = 'normal') => {
  currentLogLevel = level;
};

// Extend the Vitest Assertion interface
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): Promise<void>;
  }
}

// Error handler reference for cleanup
let globalErrorHandler: (event: PromiseRejectionEvent) => void;

// Initialize test environment
beforeAll(() => {
  try {
    // Configure axe with default settings
    configureAxe({
      rules: {
        'color-contrast': { enabled: true },
        'aria-roles': { enabled: true }
      }
    } as JestAxeConfigureOptions);
  } catch (error) {
    console.error('Failed to initialize axe-core:', error);
    throw error; // Fail fast if accessibility testing can't be initialized
  }

  // Set up global error handler
  globalErrorHandler = (event: PromiseRejectionEvent) => {
    throw event.reason;
  };
  window.addEventListener('unhandledrejection', globalErrorHandler);
});

// Cleanup global handlers
afterAll(() => {
  window.removeEventListener('unhandledrejection', globalErrorHandler);
});

// Extend vitest's expect with React Testing Library's matchers
expect.extend(matchers);
expect.extend({
  toHaveNoViolations: async (received: Element) => {
    try {
      const results = await axe(received);
      const violations = results.violations || [];
      
      return {
        pass: violations.length === 0,
        message: () => violations.length === 0
          ? 'Expected element to have accessibility violations'
          : `Found ${violations.length} accessibility violations:\n${formatViolations(violations)}`,
      };
    } catch (error) {
      throw new Error(`Failed to run accessibility tests: ${error}`);
    }
  },
});

// Mock IndexedDB for tests
import 'fake-indexeddb/auto';

// Console spies storage
interface ConsoleSpy {
  error: Mock;
  warn: Mock;
  original: {
    error: typeof console.error;
    warn: typeof console.warn;
  };
}

const consoleSpy: ConsoleSpy = {
  error: vi.fn(),
  warn: vi.fn(),
  original: {
    error: console.error,
    warn: console.warn
  }
};

// Reset all mocks and spies before each test
beforeEach(() => {
  // Reset all mocks
  vi.resetAllMocks();
  
  // Set up console spies
  console.error = consoleSpy.error;
  console.warn = consoleSpy.warn;
  
  // Clear storages
  localStorage.clear();
  sessionStorage.clear();
});

// Clean up after each test
afterEach(() => {
  // Cleanup React components
  cleanup();
  
  // Assert no console errors occurred
  expect(consoleSpy.error).not.toHaveBeenCalled();
  
  // Restore console methods
  console.error = consoleSpy.original.error;
  console.warn = consoleSpy.original.warn;
  
  // Reset timers if they were used
  vi.useRealTimers();
});

// Utility Types
type AsyncCondition = () => boolean | Promise<boolean>;
type StorageData = Record<string, string>;

// Custom test utilities
export const createTestId = (name: string): string => `test-${name}`;

// Async utilities with proper error handling
export const waitForCondition = async (
  condition: AsyncCondition,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();

  try {
    while (Date.now() - startTime < timeout) {
      if (await Promise.resolve(condition())) return;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout');
  } catch (error) {
    throw new Error(`Condition check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced fetch mock with error handling
export const mockFetch = (response: unknown, options: { status?: number; statusText?: string; headers?: Record<string, string> } = {}) => {
  const { status = 200, statusText = 'OK', headers = {} } = options;
  
  return vi.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText,
      headers: new Headers(headers),
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(typeof response === 'string' ? response : JSON.stringify(response)),
      blob: () => Promise.resolve(new Blob([typeof response === 'string' ? response : JSON.stringify(response)])),
    } as Response)
  );
};

// Type-safe mock function creator with better error handling
export function createTypedMock<T extends (...args: any[]) => any>(
  implementation?: T,
  mockName?: string
): Mock {
  const mock = vi.fn(implementation);
  if (mockName) mock.mockName(mockName);
  return mock;
}

// Enhanced test environment setup
export const setupTestEnvironment = ({
  localStorage = {},
  sessionStorage = {},
  mockDate,
  mockSystemTime = false,
}: {
  localStorage?: StorageData;
  sessionStorage?: StorageData;
  mockDate?: Date;
  mockSystemTime?: boolean;
} = {}) => {
  try {
    // Set up storage
    Object.entries(localStorage).forEach(([key, value]) => {
      window.localStorage.setItem(key, value);
    });
    
    Object.entries(sessionStorage).forEach(([key, value]) => {
      window.sessionStorage.setItem(key, value);
    });

    // Handle date mocking
    if (mockDate || mockSystemTime) {
      vi.useFakeTimers();
      if (mockDate) vi.setSystemTime(mockDate);
    }

    return {
      cleanup: () => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        if (mockDate || mockSystemTime) vi.useRealTimers();
      }
    };
  } catch (error) {
    throw new Error(`Failed to setup test environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test data generator with validation
export const generateTestData = <T>(
  factory: (index: number) => T,
  count: number,
  validate?: (item: T) => boolean
): T[] => {
  if (count < 0) throw new Error('Count must be non-negative');
  
  const items = Array.from({ length: count }, (_, i) => factory(i));
  
  if (validate) {
    const invalidItems = items.filter(item => !validate(item));
    if (invalidItems.length > 0) {
      throw new Error(`Generated ${invalidItems.length} invalid items`);
    }
  }
  
  return items;
};

// Accessibility test helper with detailed reporting
export const testAccessibility = async (container: Element): Promise<void> => {
  try {
    const results = await axe(container);
    if (results.violations.length > 0) {
      throw new Error(formatViolations(results.violations));
    }
  } catch (error) {
    throw new Error(`Accessibility test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to format accessibility violations
function formatViolations(violations: AxeResult[]): string {
  return violations.map(violation => {
    const nodes = violation.nodes.map((node: NodeResult) => 
      `  - ${node.html}\n    ${node.failureSummary}`
    ).join('\n');
    
    return `\nRule violated: ${violation.id}\nImpact: ${violation.impact}\nDescription: ${violation.help}\nElements affected:\n${nodes}`;
  }).join('\n\n');
}