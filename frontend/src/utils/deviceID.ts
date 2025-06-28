// deviceId.ts

/**
 * Returns a unique device ID stored in localStorage (or generates a new one)
 */
export const getDeviceId = (): string => {
  try {
    const deviceId = localStorage.getItem('deviceID');
    if (deviceId) return deviceId;

    const newId = generateUUID();
    localStorage.setItem('deviceID', newId);
    return newId;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return generateUUID();
  }
};

/**
 * Generates a pseudo-random UUID (RFC4122 version 4-ish)
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
