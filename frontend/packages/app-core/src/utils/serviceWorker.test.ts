import { describe, expect, it } from 'vitest';
import { buildServiceWorkerScriptUrl } from './serviceWorker';

describe('buildServiceWorkerScriptUrl', () => {
  it('uses the stable development path when no build version is available', () => {
    expect(buildServiceWorkerScriptUrl()).toBe('/sw.js');
    expect(buildServiceWorkerScriptUrl('   ')).toBe('/sw.js');
  });

  it('cache-busts production workers with the exact build version', () => {
    expect(buildServiceWorkerScriptUrl('commit/abc 123')).toBe(
      '/sw.js?v=commit%2Fabc%20123',
    );
  });
});
