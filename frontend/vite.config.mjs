// vite.config.mjs
import { defineConfig, loadEnv } from 'vite';
import react            from '@vitejs/plugin-react';
import path             from 'node:path';

const isCI = process.env.CI === 'true';
const isWindows = process.platform === 'win32';
const lowMemoryMode = isWindows || process.env.VITEST_LOW_MEMORY === '1';
const enableHtmlReport = process.env.VITEST_HTML_REPORT === '1';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const assetOrigin = (env.VITE_ASSET_ORIGIN || 'https://pokemongonexus.com').replace(/\/+$/, '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@tests': path.resolve(__dirname, 'tests'),
        '@shared-contracts': path.resolve(__dirname, '../packages/shared-contracts/src')
      }
    },
    server : {
      port: 3000,
      hmr: true,
      overlay: true,
      proxy: {
        // Keep legacy /images paths functional in dev without local public/images files.
        '/images': {
          target: assetOrigin,
          changeOrigin: true,
          secure: true,
        },
      },
    },

    build: {
      // Keep logs during development, but strip console/debugger in production bundles.
      minify: 'esbuild',
      target: 'esnext',
      esbuild: {
        drop: ['console', 'debugger'],
      },
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            // Keep only clearly isolated heavy libraries split out.
            // Note: aggressive vendor splitting (react/router/state/utils)
            // created circular chunk dependencies in production.
            if (id.includes('react-datepicker')) {
              return 'vendor-datepicker';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-capture';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('/idb/')) {
              return 'vendor-idb';
            }
            if (id.includes('/ol/')) {
              return 'vendor-maps';
            }

            // Let Rollup/Vite decide for the rest to avoid cyclic chunks.
            return undefined;
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
      pool           : lowMemoryMode ? 'forks' : 'threads',
      fileParallelism: lowMemoryMode ? false : true,
      poolOptions    : lowMemoryMode
        ? {
            forks: {
              singleFork: true,
            },
          }
        : {
            threads: {
              singleThread: false,
              minThreads: 2,
              maxThreads: 4,
            },
          },
      sequence       : {
        shuffle: false,
        concurrent: false,
        hooks: 'list'
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
          // Conservative starting gate; ratchet upward as coverage work lands.
          statements: 25,
          branches: 25,
          functions: 25,
          lines: 25
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
        ...(enableHtmlReport
          ? [
              [
                'html',
                {
                  outputFile: 'tests/reports/html/index.html',
                },
              ],
            ]
          : []),
        ...(isCI
          ? [
              [
                'junit',
                {
                  outputFile: 'tests/reports/junit.xml',
                  classname: ({ filepath }) =>
                    filepath.replace(/\.test\.[jt]sx?$/, ''),
                  suiteName: 'Frontend Tests',
                },
              ],
            ]
          : []),
      ],

      watch: {
        coverage: {
          enabled: false
        }
      }
    },
  };
});
