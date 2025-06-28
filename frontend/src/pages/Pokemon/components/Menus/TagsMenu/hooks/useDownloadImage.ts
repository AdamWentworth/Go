// useDownloadImage.ts

import { useState } from 'react';
import html2canvas from 'html2canvas';

export default function useDownloadImage(): { 
  isDownloading: boolean; 
  downloadImage: (captureArea: HTMLElement, filename: string) => Promise<void>; 
} {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const downloadImage = async (captureArea: HTMLElement, filename: string): Promise<void> => {
    if (!captureArea) return;
    setIsDownloading(true);

    // Freeze dimensions by reading computed size.
    const rect = captureArea.getBoundingClientRect();
    captureArea.style.width = `${rect.width}px`;
    captureArea.style.height = `${rect.height}px`;

    // Wait for re-render using requestAnimationFrame.
    const rafPromise = () => new Promise(resolve => requestAnimationFrame(resolve));
    await rafPromise();
    await rafPromise();

    try {
      const canvas = await html2canvas(captureArea, {
        scale: 1,
        height: rect.height,
      });

      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      // Reset dimensions.
      captureArea.style.width = "";
      captureArea.style.height = "";
      setIsDownloading(false);
    }
  };

  return { isDownloading, downloadImage };
}
