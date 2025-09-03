// LevelArc.tsx
import React from 'react';
import './LevelArc.css';

export interface LevelArcProps {
  level?: number | null;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  dotRadius?: number;
  fitToContainer?: boolean;
  className?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Build a circular arc path using SVG 'A' commands from angle a1 -> a2 (clockwise on the top half). */
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);

  let delta = Math.abs(a2 - a1);
  delta = ((delta % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  const largeArc = delta > Math.PI ? 1 : 0;
  const sweep = 1; // <-- CLOCKWISE sweep so left->right follows the TOP semicircle

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

const LevelArc: React.FC<LevelArcProps> = ({
  level = 1,
  min = 1,
  max = 50,
  size = 240,
  strokeWidth = 3,
  dotRadius = 12,
  fitToContainer = false,
  className = '',
}) => {
  // ViewBox: width=1000, height=500 (top semicircle of a circle centered at 500,500)
  const VB_W = 1000;
  const VB_H = 500;
  const r = VB_W / 2;
  const cx = r;
  const cy = r;

  // Progress along the top semicircle from left (π) → right (2π)
  const L = typeof level === 'number' ? level : min;
  const span = max - min;
  const tRaw = span !== 0 ? (clamp(L, min, max) - min) / span : 0;

  // Shift so the integer midpoint sits exactly at the apex
  const midInt = Math.floor((min + max) / 2);
  const tAtMidInt = span !== 0 ? (midInt - min) / span : 0.5;
  const tShift = 0.5 - tAtMidInt;
  const progress = clamp(tRaw + tShift, 0, 1);

  // Angles
  const leftA = Math.PI;         // left end
  const rightA = 2 * Math.PI;    // right end
  const dotA = leftA + progress * (rightA - leftA);

  // Paths: completed (left → dot) and remaining (dot → right)
  const completedD = progress > 0 ? arcPath(cx, cy, r, leftA, dotA) : '';
  const remainingD = progress < 1 ? arcPath(cx, cy, r, dotA, rightA) : '';

  // Dot position
  const dotX = cx + r * Math.cos(dotA);
  const dotY = cy + r * Math.sin(dotA);

  const style: React.CSSProperties = fitToContainer
    ? { width: '100%', height: '100%', overflow: 'visible' }
    : { width: `${size}px`, height: 'auto', overflow: 'visible' };

  return (
    <svg
      className={`level-arc-svg ${className}`}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Remaining segment (dot → right): grey & slightly transparent */}
      {remainingD && (
        <path
          d={remainingD}
          fill="none"
          stroke="var(--arc-remaining, rgba(180,180,180,0.45))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* Completed segment (left → dot): white */}
      {completedD && (
        <path
          d={completedD}
          fill="none"
          stroke="var(--arc-complete, rgba(255,255,255,0.95))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* Level dot */}
      <circle
        cx={dotX}
        cy={dotY}
        r={dotRadius}
        fill="#fff"
        stroke="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default LevelArc;
