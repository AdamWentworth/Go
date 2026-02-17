// src/components/WindowOverlay.tsx
import React, { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import './WindowOverlay.css';

export interface WindowOverlayProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const WindowOverlay: React.FC<WindowOverlayProps> = ({
  children,
  onClose: _onClose,
  className = '',
  ...divProps
}) => {
  const handleWindowClick = (event: MouseEvent<HTMLDivElement>) => {
    // prevent click from bubbling out to backdrop
    event.stopPropagation();
  };

  return (
    <div
      {...divProps}
      className={`overlay-content ${className}`}
      onClick={handleWindowClick}
    >
      {children}
    </div>
  );
};

export default WindowOverlay;
