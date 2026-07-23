export function buildServiceWorkerScriptUrl(version?: string): string {
  const normalizedVersion = version?.trim();

  return normalizedVersion
    ? `/sw.js?v=${encodeURIComponent(normalizedVersion)}`
    : '/sw.js';
}
