// vite.config.mjs
import { defineConfig, loadEnv } from 'vite';
import react            from '@vitejs/plugin-react';
import fs               from 'node:fs';
import path             from 'node:path';

const isCI = process.env.CI === 'true';
const isWindows = process.platform === 'win32';
const lowMemoryMode = isWindows || process.env.VITEST_LOW_MEMORY === '1';
const enableHtmlReport = process.env.VITEST_HTML_REPORT === '1';
const appCoreRoot = path.resolve(__dirname, '../../packages/app-core');
const webRoot = __dirname;
const sharedAssetsRoot = path.resolve(__dirname, '../../../assets');
const testArtifactsRoot = path.resolve(webRoot, '.artifacts/tests');
const appCoreSetupFile = `/@fs/${path
  .resolve(appCoreRoot, 'tests/setupTests.ts')
  .replace(/\\/g, '/')}`;

const mediaContentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
]);

const sharedMediaAssetsPlugin = () => ({
  name: 'go-shared-media-assets',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
        next();
        return;
      }

      const { pathname } = new URL(req.url, 'http://localhost');
      if (!pathname.startsWith('/media/')) {
        next();
        return;
      }

      let relativePath;
      try {
        relativePath = decodeURIComponent(pathname.slice('/media/'.length));
      } catch {
        res.statusCode = 400;
        res.end('Bad Request');
        return;
      }

      const filePath = path.resolve(sharedAssetsRoot, relativePath);
      if (!filePath.startsWith(`${sharedAssetsRoot}${path.sep}`)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
          next();
          return;
        }

        const contentType = mediaContentTypes.get(path.extname(filePath).toLowerCase());
        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'no-cache');

        if (req.method === 'HEAD') {
          res.end();
          return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', next);
        stream.pipe(res);
      });
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, webRoot, '');
  const assetOrigin = (env.VITE_ASSET_ORIGIN || 'https://pokemongonexus.com').replace(/\/+$/, '');

  return {
    root: appCoreRoot,
    envDir: webRoot,
    plugins: [sharedMediaAssetsPlugin(), react()],
    resolve: {
      alias: {
        '@': path.resolve(appCoreRoot, 'src'),
        '@tests': path.resolve(appCoreRoot, 'tests'),
        '@shared-contracts': path.resolve(__dirname, '../../packages/shared-contracts/src')
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
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
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

    cacheDir: path.join(testArtifactsRoot, '.vitest'),

    /* ---------- Vitest --------------------------------------------------- */
    test: {
      globals    : true,
      environment: 'jsdom',
      setupFiles : [appCoreSetupFile],
      testTimeout: 10000,

      isolate        : true,
      pool           : lowMemoryMode ? 'forks' : 'threads',
      maxWorkers     : lowMemoryMode ? 1 : 4,
      fileParallelism: lowMemoryMode ? false : true,
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
        reportsDirectory: path.join(testArtifactsRoot, 'coverage'),
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
                  outputFile: path.join(testArtifactsRoot, 'reports/html/index.html'),
                },
              ],
            ]
          : []),
        ...(isCI
          ? [
              [
                'junit',
                {
                  outputFile: path.join(testArtifactsRoot, 'reports/junit.xml'),
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
