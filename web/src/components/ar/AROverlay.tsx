import type { ArrowDirection } from '../../stores/useSessionStore';

export interface AROverlayProps {
  arrowDirection: ArrowDirection;
}

/**
 * Per-direction CSS rotation applied on top of the PNG. The current PNG set
 * is pre-oriented (the right/left assets already curve toward their target),
 * so all three sit at 0°. If you swap in flat arrows that all point up,
 * change `left` to -35 and `right` to 35.
 */
const DIRECTION_ROTATION: Record<ArrowDirection, number> = {
  straight: 0,
  left: 0,
  right: 0,
};

const ARROW_ASSET: Record<ArrowDirection, string> = {
  straight: '/arrows/arrow-straight.png',
  left: '/arrows/arrow-left.png',
  right: '/arrows/arrow-right.png',
};

/**
 * Square bounding box the arrow art is scaled to fit. `object-fit: contain`
 * preserves the PNG's intrinsic aspect ratio, so vertical straight and
 * landscape curved arrows both sit centered in the same footprint.
 */
const ARROW_BOX = 220;

/**
 * AR overlay layer — pulsing cyan arrow only. Detection bboxes used to be
 * drawn here but are now invisible — the step machine still consumes them
 * from `detectionService` under the hood.
 */
export function AROverlay({ arrowDirection }: AROverlayProps) {
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

      {/* AR arrow — center-lower, rotates with `arrowDirection`.
          Artwork loaded from /public/arrows/arrow-{direction}.png.
          Three layers: outer centers, middle rotates (smooth tween),
          inner runs the pulse-cyan scale animation. They don't fight
          because each owns its own `transform`. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[72%] z-10 pointer-events-none"
        style={{ transform: 'translate(-50%,-50%)' }}
      >
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 400ms ease-out',
          }}
        >
          <div
            className="pulse-cyan"
            style={{
              width: ARROW_BOX,
              height: ARROW_BOX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={arrowSrc}
              alt=""
              draggable={false}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
