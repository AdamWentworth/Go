import type { Page, TestInfo } from '@playwright/test';

type ConsoleLocation = {
  url: string;
  lineNumber: number;
  columnNumber: number;
};

type DiagnosticEvent =
  | {
      kind: 'console';
      type: string;
      text: string;
      location: ConsoleLocation;
    }
  | {
      kind: 'pageerror';
      message: string;
      stack?: string;
    }
  | {
      kind: 'requestfailed';
      method: string;
      url: string;
      failure: string | null;
    };

const consoleTypesThatFail = new Set(['error']);

const ignoredConsoleErrors = [
  /Download the React DevTools/i,
  /Failed to load resource: the server responded with a status of 404.*favicon/i,
];

export function attachBrowserDiagnostics(page: Page, testInfo: TestInfo) {
  const events: DiagnosticEvent[] = [];

  page.on('console', (message) => {
    events.push({
      kind: 'console',
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });

  page.on('pageerror', (error) => {
    events.push({
      kind: 'pageerror',
      message: error.message,
      stack: error.stack,
    });
  });

  page.on('requestfailed', (request) => {
    events.push({
      kind: 'requestfailed',
      method: request.method(),
      url: request.url(),
      failure: request.failure()?.errorText ?? null,
    });
  });

  return {
    async flush() {
      await testInfo.attach('browser-diagnostics.json', {
        body: JSON.stringify(events, null, 2),
        contentType: 'application/json',
      });
    },
    blockingErrors() {
      const failOnConsole = process.env.E2E_FAIL_ON_CONSOLE !== '0';
      const failOnRequestFailed = process.env.E2E_FAIL_ON_REQUEST_FAILED === '1';

      return events.filter((event) => {
        if (event.kind === 'pageerror') return true;
        if (event.kind === 'requestfailed') return failOnRequestFailed;
        if (!failOnConsole || !consoleTypesThatFail.has(event.type)) return false;
        return !ignoredConsoleErrors.some((pattern) => pattern.test(event.text));
      });
    },
  };
}
