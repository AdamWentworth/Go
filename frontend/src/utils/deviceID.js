// utils/deviceId.js

export const getDeviceId = () => {
    try {
      let deviceId = localStorage.getItem('deviceID');
      if (!deviceId) {
        deviceId = generateUUID();
        localStorage.setItem('deviceID', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.warn('localStorage is not available:', error);
      // Fallback to session-based device ID or another method
      return generateUUID();
    }
  };
  
  const generateUUID = () => {
    // Simple UUID generation function
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
  