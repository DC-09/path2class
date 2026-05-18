import clsx from 'clsx';
import type { CSSProperties } from 'react';
import type { ArrowDirection } from '../../stores/useSessionStore';
import type { Detection } from '../../services/detectionService';

export interface AROverlayProps {
  arrowDirection: ArrowDirection;
  detections: readonly Detection[];
  /** Highlight elevator detections in amber when accessibility is on. */
  accessibility: boolean;
}

const DIRECTION_ROTATION: Record<ArrowDirection, number> = {
  straight: 0,
  left: -35,
  right: 35,
};

/**
 * AR overlay layer — pulsing cyan arrow + per-detection highlight rectangles.
 * Drawn on top of the live <video>. 1:1 visual match with the prototype's
 * landmark + elevator overlays, now driven by real detection bboxes.
 */
export function AROverlay({ arrowDirection, detections, accessibility }: AROverlayProps) {
  const rotation = DIRECTION_ROTATION[arrowDirection];

  return (
    <>
      {/* Warm tint to keep the camera feed in the same visual family as the
          rest of the app — mirrors the prototype's corridor-top radial. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,233,184,0.12), transparent 60%)',
        }}
      />

      {/* Detection highlights */}
      {detections.map((d, i) => (
        <DetectionHighlight
          key={`${d.class}-${i}`}
          detection={d}
          amber={accessibility && d.class === 'elevator'}
        />
      ))}

      {/* AR arrow — center-lower, rotates with `arrowDirection`.
          Liquid Glass style: blurred cyan halo + frosted gradient body
          with a thin specular highlight on the front face.
          Three layers: outer centers, middle rotates (smooth tween),
          inner runs the pulse-cyan scale animation. They don't fight
          because each owns its own `transform`. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[58%] z-10 pointer-events-none"
        style={{ transform: 'translate(-50%,-50%)' }}
      >
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 400ms ease-out',
          }}
        >
        <div className="pulse-cyan">
        <svg width="130" height="150" viewBox="0 0 130 150" style={{ display: 'block' }}>
          <defs>
            {/* Frosted glass body — light cool top fading to project cyan */}
            <linearGradient id="ar-arrow-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E8F7FC" stopOpacity="0.85" />
              <stop offset="0.45" stopColor="#A8E3F5" stopOpacity="0.65" />
              <stop offset="1" stopColor="#5FB1C9" stopOpacity="0.75" />
            </linearGradient>
            {/* Specular sheen */}
            <linearGradient id="ar-arrow-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            {/* Soft outer glow */}
            <filter id="ar-arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Outer cyan halo */}
          <path
            d="M65 12 L113 64 Q117 70 111 72 L84 72 L84 128 Q84 134 78 134 L52 134 Q46 134 46 128 L46 72 L19 72 Q13 70 17 64 Z"
            fill="#7BC4D9"
            opacity="0.55"
            filter="url(#ar-arrow-glow)"
          />

          {/* Frosted glass body */}
          <path
            d="M65 12 L113 64 Q117 70 111 72 L84 72 L84 128 Q84 134 78 134 L52 134 Q46 134 46 128 L46 72 L19 72 Q13 70 17 64 Z"
            fill="url(#ar-arrow-body)"
            stroke="#FFFFFF"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Specular sheen across the head */}
          <path
            d="M65 16 L101 56 Q104 60 99 60 L78 60 L78 92 Q78 96 74 96 L56 96 Q52 96 52 92 L52 60 L31 60 Q26 60 29 56 Z"
            fill="url(#ar-arrow-sheen)"
            opacity="0.55"
          />

          {/* Crisp top edge */}
          <path
            d="M65 14 L101 52"
            stroke="#FFFFFF"
            strokeOpacity="0.85"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Ground shadow */}
          <ellipse cx="65" cy="142" rx="36" ry="4.5" fill="#1E3A5F" opacity="0.22" />
        </svg>
        </div>
        </div>
      </div>
    </>
  );
}

function DetectionHighlight({
  detection,
  amber,
}: {
  detection: Detection;
  amber: boolean;
}) {
  const { bbox, label } = detection;
  const style: CSSProperties = {
    left: `${bbox.x * 100}%`,
    top: `${bbox.y * 100}%`,
    width: `${bbox.w * 100}%`,
    height: `${bbox.h * 100}%`,
  };

  const colorClass = amber
    ? 'border-[color:var(--amber)] pulse-amber'
    : 'border-[color:var(--cyan)]';
  const shadowStyle = amber
    ? {
        boxShadow:
          '0 0 24px rgba(245,185,70,0.5), inset 0 0 16px rgba(245,185,70,0.25)',
        background: 'rgba(245,185,70,0.15)',
      }
    : {
        boxShadow:
          '0 0 24px rgba(123,196,217,0.5), inset 0 0 16px rgba(168,227,245,0.3)',
        background: 'rgba(168,227,245,0.12)',
      };

  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={style}
      aria-hidden
    >
      <div
        className={clsx('w-full h-full rounded-lg border-2', colorClass)}
        style={shadowStyle}
      />
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 glass rounded-full px-2.5 py-1 text-[10px] font-semibold text-[color:var(--navy)] whitespace-nowrap"
        style={amber ? { boxShadow: '0 0 16px rgba(245,185,70,0.6)' } : undefined}
      >
        {amber ? `${label} · your route` : label}
      </div>
    </div>
  );
}
