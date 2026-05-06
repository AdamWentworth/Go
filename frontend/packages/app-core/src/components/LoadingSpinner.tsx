// LoadingSpinner.tsx
import React from 'react';
import './LoadingSpinner.css';

const SPINNER_VIDEOS = [
  {
    className: 'spinner-video spinner-video--dark',
    src: '/media/media/loading_spinner.webm',
  },
  {
    className: 'spinner-video spinner-video--light',
    src: '/media/media/loading_spinner_light.webm',
  },
];

const LoadingSpinner: React.FC = () => (
  <div className="loading-container" aria-label="Loading" role="status">
    <div className="spinner-visual-shell">
      {SPINNER_VIDEOS.map((video) => (
        <video
          key={video.className}
          className={video.className}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={video.src} type="video/webm" />
        </video>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
