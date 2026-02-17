// LevelArc.tsx
import React from 'react';
import './LevelArc.css';
import { cpMultipliers } from '@/utils/constants';

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

/** Get CP Multiplier at any level (supports 0.5 steps, with linear interpolation if needed). */
function getCPM(level: number): number {
  // Round to nearest 0.5 grid bounds
  const lo = Math.floor(level * 2) / 2;
  const hi = Math.ceil(level * 2) / 2;
  const multipliers = cpMultipliers as Record<number, number>;

  const cLo = multipliers[lo];
  const cHi = multipliers[hi];

  if (cLo != null && cHi != null) {
    if (hi === lo) return cLo;
    const t = (level - lo) / (hi - lo);
    return cLo + (cHi - cLo) * t;
  }
  // Fallbacks if a key is missing (shouldn’t happen with your map)
  if (cLo != null) return cLo;
  if (cHi != null) return cHi;

  // Very defensive default
  return 0;
}

/** Build a circular arc path using SVG 'A' command from angle a1 -> a2 (clockwise on top half). */
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);

  let delta = Math.abs(a2 - a1);
  delta = ((delta % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  const largeArc = delta > Math.PI ? 1 : 0;
  const sweep = 1; // CLOCKWISE sweep so left->right follows the TOP semicircle

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

const LevelArc: React.FC<LevelArcProps> = ({
  level = 1,
  min = 1,
  max = 50,            // ignored for power mapping, kept for API parity
  size = 240,
  strokeWidth = 3,     // your thicker default
  dotRadius = 12,      // bigger dot
  fitToContainer = false,
  className = '',
}) => {
  // ViewBox: width=1000, height=500 (top semicircle of a circle centered at 500,500)
  const VB_W = 1000;
  const VB_H = 500;
  const r = VB_W / 2;
  const cx = r;
  const cy = r;

  // --- Relative power mapping ---------------------------------------------
  // Treat anything >= 50 as "max" (same as 50 / 50.5 / 51).
  const LVL_MIN = 1;
  const LVL_MAX = 50;
  const L = clamp(typeof level === 'number' ? level : LVL_MIN, LVL_MIN, LVL_MAX);

  const cpmL = getCPM(L);
  const cpmMax = getCPM(LVL_MAX) || 1; // ~0.84029999
  let p = clamp(cpmL / cpmMax, 0, 1);  // normalized relative power

  // Optional easing to fine-tune feel of the compression near high levels.
  const POWER_GAMMA = 1.0; // try 0.9 (more right-compression) or 1.1 (less)
  if (POWER_GAMMA !== 1.0) p = Math.pow(p, POWER_GAMMA);

  // Angles along the top semicircle (left π → right 2π)
  const leftA = Math.PI;
  const rightA = 2 * Math.PI;
  const dotA = leftA + p * (rightA - leftA);

  // Paths: completed (left → dot) and remaining (dot → right)
  const completedD = p > 0 ? arcPath(cx, cy, r, leftA, dotA) : '';
  const remainingD = p < 1 ? arcPath(cx, cy, r, dotA, rightA) : '';

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
