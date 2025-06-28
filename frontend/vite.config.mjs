// vite.config.mjs
import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import path             from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'tests')
    }
  },
  server : {
    port: 3000,
    hmr: true,
    overlay: true
  },

  cacheDir: 'tests/.vitest',

  /* ---------- Vitest --------------------------------------------------- */
  test: {
    globals    : true,
    environment: 'jsdom',
    setupFiles : ['tests/setupTests.ts'],
    testTimeout: 10000,

    isolate        : true,
    fileParallelism: true,
    poolOptions    : {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 4
      }
    },
    sequence       : {
      shuffle: true,
      concurrent: true,
      hooks: 'parallel'
    },

    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: 'tests/coverage',
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      },
      exclude: [
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types/**'
      ]
    },

    reporters: [
      'default',
      ['html', {
        outputFile: 'tests/reports/html/index.html'
      }],
      ['junit', { 
        outputFile: 'tests/reports/junit.xml',
        classname: ({ filepath }) => filepath.replace(/\.test\.[jt]sx?$/, ''),
        suiteName: 'Frontend Tests'
      }]
    ],

    watch: {
      coverage: {
        enabled: false
      }
    }
  },
});
