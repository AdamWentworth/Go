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

  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          // Split heavy, route-specific libraries out of core startup bundles.
          if (id.includes('react-datepicker')) {
            return 'vendor-datepicker';
          }
          if (id.includes('html2canvas')) {
            return 'vendor-capture';
          }
          if (id.includes('react-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('@tanstack/react-virtual') || id.includes('react-window') || id.includes('react-virtualized-auto-sizer')) {
            return 'vendor-virtual';
          }
          if (id.includes('/idb/')) {
            return 'vendor-idb';
          }

          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'vendor-router';
          }
          if (id.includes('zustand') || id.includes('immer')) {
            return 'vendor-state';
          }
          if (id.includes('axios') || id.includes('lodash') || id.includes('date-fns')) {
            return 'vendor-utils';
          }
          if (id.includes('/ol/')) {
            return 'vendor-maps';
          }

          return 'vendor';
        }
      }
    }
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
