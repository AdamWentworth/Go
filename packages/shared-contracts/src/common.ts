export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type UrlQueryValue = string | number | boolean | null | undefined;

export const buildUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, UrlQueryValue>,
): string => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, normalizedBase);
  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
};
