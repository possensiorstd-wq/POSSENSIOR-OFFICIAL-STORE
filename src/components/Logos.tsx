import React from 'react';
import greenLogo from '../assets/images/GREEN LOGO.png';

interface LogoProps {
  className?: string;
  color?: string;
  size?: number;
}

/**
 * Possensior Stylized "P" Emblem
 * Uses GREEN LOGO.png
 */
export const PossensiorIcon: React.FC<LogoProps> = ({
  className = 'w-32 h-32',
  color = '#365E52',
  size,
}) => {
  return (
    <img
      src={greenLogo}
      alt="Possensior Emblem"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
      }}
    />
  );
};

/**
 * Possensior Wordmark Logo
 * Clean, modern vector typography for header & navigation
 * matching "HOME HEADER LOGO.png"
 */
export const PossensiorWordmark: React.FC<LogoProps> = ({
  className = 'h-8 w-auto',
  color = '#365E52',
}) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto max-h-10"
        aria-label="Possensior Logo"
      >
        {/* Stylized P initial matching brand logo */}
        <path
          d="M34.2 36.8C33.8 36.8 33.1 36.9 32.2 37C30.4 37.2 28.7 37.6 27 38.1C24.4 39 22.8 40.5 22.3 42.5C21.8 44.5 22.6 46 24.8 47C27.1 48 30 48.1 33.5 47.2C35.3 46.8 37.5 46 40 45L35.8 57.3C34.7 60.4 33.8 62.8 33 64.6C32.2 66.4 31.3 67.8 30.3 68.8C29.3 69.8 27.8 70.5 25.9 71C27.1 71.7 28.9 72.2 31.3 72.5C33.7 72.8 36 72.6 38.2 71.8C40.3 71.1 41.9 69.9 43.1 68.2C44.3 66.5 45.5 64 46.7 60.7L51.1 48.8C55.5 47.1 59.8 44.9 63.9 42.2C68 39.5 71.3 36.3 73.7 32.7C76.1 29.1 77 25.5 76.3 21.9C75.7 18.6 73.8 16 70.6 14.1C67.4 12.2 63.2 11.3 58.1 11.3C52.1 11.3 46.7 12.5 41.9 14.9C37.1 17.3 33.2 20.7 30.1 25.1C28.5 27.3 27.5 29.7 27.1 32.1C27 32.8 27.2 33.4 27.7 33.8C28.2 34.2 28.9 34.3 29.8 34.1C30.7 33.9 31.4 33.4 31.9 32.6C33 30.9 34.5 29 36.4 26.8C38.7 24.2 41.5 22.1 44.8 20.5C48.1 18.9 51.9 18.1 56.2 18.1C60.1 18.1 63 18.8 65 20.2C67 21.6 67.9 23.6 67.7 26.3C67.5 29 66.1 31.8 63.6 34.7C61.1 37.6 57.5 40.3 52.9 42.9L56.4 33.7C57.1 31.8 57.5 30.1 57.6 28.7C57.7 27.3 57.4 26.2 56.7 25.5C56 24.8 54.8 24.4 53.2 24.4C52.3 24.4 51.4 24.5 50.5 24.8C49.6 25.1 48.9 25.6 48.3 26.2C47.7 26.8 47.2 27.6 46.9 28.5L39.6 48C37.8 48.7 36.1 49.2 34.5 49.5C32.3 49.9 30.4 49.7 28.9 48.9C27.4 48.1 26.9 46.9 27.4 45.2C27.9 43.8 29.1 42.7 31 42C32.4 41.5 34 41.2 35.9 41.1L34.2 36.8Z"
          fill={color}
        />

        {/* ossensior Typography with custom italic streetwear kerning */}
        <text
          x="72"
          y="56"
          fill={color}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontStyle="italic"
          fontSize="48"
          letterSpacing="-1.5px"
        >
          ossensior
        </text>
      </svg>
    </div>
  );
};
