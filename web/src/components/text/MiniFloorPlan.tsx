import { useTranslation } from 'react-i18next';

export interface MiniFloorPlanProps {
  accessibility: boolean;
  stepIndex: number;
}

/**
 * Top-down schematic of the corridor with the active route and the user dot.
 * L-shape: a long horizontal stretch starting at the QR/elevator, then a
 * perpendicular branch on the right ending at Room 124.
 *
 * The 6 node positions map to the 6 entries in `corridor.json` steps.
 */
export function MiniFloorPlan({ stepIndex }: MiniFloorPlanProps) {
  const { t } = useTranslation();

  // 6 positions, one per corridor.json step. Step 0 sits clearly past the
  // INIZIO marker so the start label is never obscured by the dot.
  const nodes: Array<[number, number]> = [
    [78, 50], // 0 — at INIZIO (elevator / QR), facing forward
    [90, 50], // 1 — same area, after YOLO confirms (arrow → right)
    [200, 50], // 2 — past the fire-alarm door, mid-corridor
    [305, 50], // 3 — at the large sign (turn point, arrow → right)
    [320, 95], // 4 — into the room corridor, "destination on right"
    [320, 122], // 5 — at Room 124 (two doors close together)
  ];
  const pathD = nodes
    .map((n, i) => (i === 0 ? `M${n[0]} ${n[1]}` : `L${n[0]} ${n[1]}`))
    .join(' ');
  const dotIndex = Math.min(stepIndex, nodes.length - 1);
  const dot = nodes[dotIndex];

  return (
    <svg viewBox="0 0 380 140" className="w-full h-[140px]" aria-label="Floor plan with route">
      {/* L-shaped corridor — two overlapping rectangles */}
      <rect
        x="20"
        y="30"
        width="320"
        height="40"
        rx="3"
        fill="#F4F3EF"
        stroke="#1E3A5F"
        strokeOpacity="0.2"
      />
      <rect
        x="300"
        y="30"
        width="40"
        height="100"
        rx="3"
        fill="#F4F3EF"
        stroke="#1E3A5F"
        strokeOpacity="0.2"
      />
      {/* Hide the seam where the two corridor rects meet */}
      <line x1="301" y1="31" x2="339" y2="31" stroke="#F4F3EF" strokeWidth="2" />
      <line x1="301" y1="69" x2="339" y2="69" stroke="#F4F3EF" strokeWidth="2" />

      {/* INIZIO marker (start) */}
      <rect x="22" y="32" width="34" height="36" rx="2" fill="#E8DFC9" opacity="0.55" />
      <text
        x="39"
        y="54"
        textAnchor="middle"
        fontSize="7"
        fontFamily="Inter"
        fontWeight="700"
        fill="#1E3A5F"
      >
        {t('text_nav.floor_plan_start').toUpperCase()}
      </text>

      {/* Generic door notches along the horizontal stretch (top side) */}
      {[120, 180, 250].map((x) => (
        <rect key={`t-${x}`} x={x} y="26" width="22" height="6" fill="#3a5575" opacity="0.6" />
      ))}
      {/* Generic door notches along the horizontal stretch (bottom side) */}
      {[150, 220].map((x) => (
        <rect key={`b-${x}`} x={x} y="68" width="22" height="6" fill="#3a5575" opacity="0.6" />
      ))}

      {/* Two doors on the LEFT wall of the vertical arm (user's right when
          walking down — the actual side where Room 124 sits). */}
      <rect x="294" y="82" width="6" height="18" fill="#3a5575" opacity="0.6" />

      {/* Room 124 marker (the second of the two doors, on the same wall) */}
      <g>
        <rect x="294" y="106" width="6" height="18" fill="#7BC4D9" />
        <circle cx="285" cy="115" r="7" fill="#7BC4D9" />
        <text
          x="285"
          y="118"
          textAnchor="middle"
          fontSize="6"
          fontFamily="Inter"
          fontWeight="700"
          fill="#F4F3EF"
        >
          124
        </text>
      </g>

      {/* Route — dashed cyan line tracing the L */}
      <path
        d={pathD}
        fill="none"
        stroke="#7BC4D9"
        strokeWidth="2.5"
        strokeDasharray="5 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* User dot */}
      <circle cx={dot[0]} cy={dot[1]} r="7" fill="#7BC4D9" opacity="0.3">
        <animate attributeName="r" values="7;11;7" dur="1.4s" repeatCount="indefinite" />
        <animate
          attributeName="opacity"
          values="0.3;0;0.3"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={dot[0]} cy={dot[1]} r="4.5" fill="#7BC4D9" stroke="#F4F3EF" strokeWidth="1.5" />
    </svg>
  );
}
