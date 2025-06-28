// loggers.ts

export function logSize(label: string, data: unknown) {
    try {
      const size = new Blob([JSON.stringify(data)]).size;
      console.log(`${label} size in bytes: ${size}`);
    } catch (err) {
      console.log(`Error measuring size of ${label}:`, err);
    }
  }
  