import { getStorageBoolean, STORAGE_KEYS } from '@/utils/storage';

export const applyThemePreferenceToDocument = (isLightMode: boolean): void => {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
  document.documentElement.style.colorScheme = isLightMode ? 'light' : 'dark';
};

export const applyStoredThemePreferenceToDocument = (): boolean => {
  const isLightMode = getStorageBoolean(STORAGE_KEYS.isLightMode, false);
  applyThemePreferenceToDocument(isLightMode);
  return isLightMode;
};
