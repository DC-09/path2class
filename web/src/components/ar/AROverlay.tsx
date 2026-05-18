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

const ARROW_ASSET: Record<ArrowDirection, string> = {
  straight: '/arrows/arrow-straight.png',
  left: '/arrows/arrow-left.png',
  right: '/arrows/arrow-right.png',
};

/** Rendered size on screen — PNGs should be at least 2× this for crisp retina. */
const ARROW_WIDTH = 130;
const ARROW_HEIGHT = 150;

/**
 * AR overlay layer — pulsing cyan arrow + per-detection highlight rectangles.
 * Drawn on top of the live <video>. 1:1 visual match with the prototype's
 * landmark + elevator overlays, now driven by real detection bboxes.
 */
export function AROverlay({ arrowDirection, detections, accessibility }: AROverlayProps) {
  const rotation = DIRECTION_ROTATION[arrowDirection];
  const arrowSrc = ARROW_ASSET[arrowDirection];

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
          Artwork loaded from /public/arrows/arrow-{direction}.png.
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
            <img
              src={arrowSrc}
              alt=""
              width={ARROW_WIDTH}
              height={ARROW_HEIGHT}
              draggable={false}
              style={{
                display: 'block',
                width: ARROW_WIDTH,
                height: ARROW_HEIGHT,
                userSelect: 'none',
              }}
            />
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
