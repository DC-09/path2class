export interface MiniFloorPlanProps {
  accessibility: boolean;
  stepIndex: number;
}

/**
 * Top-down schematic of the corridor with the active route and the user dot.
 * 1:1 port from PROTOTYPE_REFERENCE.html. Accessibility ON routes via the
 * elevator and marks the stairs as unavailable.
 */
export function MiniFloorPlan({ accessibility, stepIndex }: MiniFloorPlanProps) {
  const nodes: Array<[number, number]> = accessibility
    ? [
        [40, 60],
        [70, 60],
        [70, 35],
        [150, 35],
        [260, 35],
        [340, 35],
        [340, 60],
      ]
    : [
        [40, 60],
        [150, 60],
        [240, 60],
        [310, 60],
        [340, 60],
      ];
  const pathD = nodes
    .map((n, i) => (i === 0 ? `M${n[0]} ${n[1]}` : `L${n[0]} ${n[1]}`))
    .join(' ');
  const dotIndex = Math.min(stepIndex, nodes.length - 1);
  const dot = nodes[dotIndex];

  return (
    <svg viewBox="0 0 380 120" className="w-full h-[120px]" aria-label="Floor plan with route">
      {/* corridor box */}
      <rect
        x="20"
        y="30"
        width="340"
        height="60"
        rx="4"
        fill="#F4F3EF"
        stroke="#1E3A5F"
        strokeOpacity="0.2"
      />
      {/* elevator */}
      <rect
        x="22"
        y="32"
        width="34"
        height="28"
        fill={accessibility ? '#F5B946' : '#E8DFC9'}
        opacity={accessibility ? 0.35 : 0.5}
      />
      <text
        x="39"
        y="50"
        textAnchor="middle"
        fontSize="7"
        fontFamily="Inter"
        fontWeight="600"
        fill="#1E3A5F"
      >
        ELV
      </text>
      {/* stairs */}
      <rect
        x="324"
        y="32"
        width="34"
        height="28"
        fill="#E8DFC9"
        opacity={accessibility ? 0.25 : 0.5}
      />
      <text
        x="341"
        y="50"
        textAnchor="middle"
        fontSize="7"
        fontFamily="Inter"
        fontWeight="600"
        fill="#1E3A5F"
        opacity={accessibility ? 0.4 : 1}
      >
        STR
      </text>
      {accessibility && (
        <g>
          <circle cx="341" cy="46" r="10" fill="none" stroke="#E86A5C" strokeWidth="1.5" />
          <line x1="334" y1="39" x2="348" y2="53" stroke="#E86A5C" strokeWidth="1.5" />
        </g>
      )}
      {/* door notches top */}
      {[90, 150, 210, 270].map((x) => (
        <rect key={`t-${x}`} x={x} y="26" width="22" height="6" fill="#3a5575" opacity="0.7" />
      ))}
      {[120, 240].map((x) => (
        <rect key={`b-${x}`} x={x} y="88" width="22" height="6" fill="#3a5575" opacity="0.7" />
      ))}
      {/* 21W marker */}
      <g>
        <rect x="268" y="88" width="24" height="6" fill="#7BC4D9" />
        <circle cx="280" cy="86" r="6" fill="#7BC4D9" />
        <text
          x="280"
          y="89"
          textAnchor="middle"
          fontSize="6"
          fontFamily="Inter"
          fontWeight="700"
          fill="#F4F3EF"
        >
          21W
        </text>
      </g>
      {/* route */}
      <path
        d={pathD}
        fill="none"
        stroke="#7BC4D9"
        strokeWidth="2.5"
        strokeDasharray="5 3"
        strokeLinecap="round"
      />
      {/* user dot */}
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
