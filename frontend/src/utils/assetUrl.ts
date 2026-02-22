const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

const getAssetOrigin = (): string | null => {
  const configured = import.meta.env.VITE_ASSET_ORIGIN;
  if (typeof configured !== 'string') return null;
  const trimmed = configured.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
};

export const resolveAssetUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (ABSOLUTE_URL_PATTERN.test(trimmed)) return trimmed;

  const origin = getAssetOrigin();
  if (!origin) return trimmed;
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return `${origin}/${trimmed.replace(/^\.?\//, '')}`;
};

const shouldNormalizeAssetField = (key: string): boolean => {
  const normalized = key.toLowerCase();
  return (
    normalized.includes('image_url') ||
    normalized.endsWith('_icon') ||
    normalized === 'sprite_url'
  );
};

type Jsonish =
  | string
  | number
  | boolean
  | null
  | Jsonish[]
  | { [key: string]: Jsonish };

const normalizeNode = (node: Jsonish): Jsonish => {
  if (Array.isArray(node)) return node.map(normalizeNode);
  if (node === null || typeof node !== 'object') return node;

  const result: { [key: string]: Jsonish } = {};
  for (const [key, rawValue] of Object.entries(node)) {
    if (typeof rawValue === 'string' && shouldNormalizeAssetField(key)) {
      result[key] = resolveAssetUrl(rawValue);
      continue;
    }
    result[key] = normalizeNode(rawValue as Jsonish);
  }
  return result;
};

export const normalizeAssetUrlsDeep = <T>(input: T): T =>
  normalizeNode(input as Jsonish) as T;

