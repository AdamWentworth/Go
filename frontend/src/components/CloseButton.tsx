// src/components/CloseButton.tsx
import React, { ButtonHTMLAttributes } from 'react';
import './CloseButton.css';
import { useTheme } from '../contexts/ThemeContext';

export interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  className = '',
  style,
  ...buttonProps
}) => {
  const { isLightMode } = useTheme();

  const imageSrc = isLightMode
    ? '/images/close-button-light.png'
    : '/images/close-button.png';

  return (
    <button
      {...buttonProps}
      className={`close-button ${className}`}
      type="button"
      onClick={onClick}
      style={style}
      aria-label="Close"
    >
      <img
        src={imageSrc}
        alt="Close"
        className="close-button-image"
      />
    </button>
  );
};

export default CloseButton;
