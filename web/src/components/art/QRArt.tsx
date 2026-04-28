/**
 * Decorative QR code glyph for the Splash card.
 * Not scannable — visual only.
 */
export function QRArt() {
  const dark = '#1E3A5F';
  const accent = '#7BC4D9';
  const finderColor = '#3B7DD8';

  // 21x21 grid — finder pattern zones are rendered separately as shapes
  // 0 = empty, 1 = dark module, 2 = skip (finder zone handled below)
  const grid = [
    [2,2,2,2,2,2,2,0,1,0,1,0,1,0,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,0,0,1,0,1,0,0,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,0,1,0,1,0,1,0,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,0,0,1,1,0,0,0,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,0,1,1,0,1,1,0,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,0,0,0,1,0,0,0,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,0,1,0,1,0,1,0,2,2,2,2,2,2,2],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,1],
    [1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
    [0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],
    [1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,0,0,1,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,1,0,0,0,1,0,0,1],
    [2,2,2,2,2,2,2,0,0,1,0,0,1,0,1,0,1,1,0,1,0],
    [2,2,2,2,2,2,2,0,1,0,1,1,0,1,0,1,0,0,1,0,1],
    [2,2,2,2,2,2,2,0,0,0,0,1,1,0,1,1,0,1,1,0,0],
    [2,2,2,2,2,2,2,0,1,1,0,0,1,0,0,0,1,0,0,1,1],
    [2,2,2,2,2,2,2,0,0,1,1,1,0,1,1,0,0,1,0,1,0],
    [2,2,2,2,2,2,2,0,1,0,0,0,1,0,0,1,1,0,1,0,1],
    [2,2,2,2,2,2,2,0,0,1,1,0,0,1,0,0,1,1,0,1,1],
  ];

  const cell = 9;
  const gap = 1.2;
  const total = 21 * cell;

  // Finder pattern: outer rounded square + white ring + inner square
  function Finder({ col, row }: { col: number; row: number }) {
    const x = col * cell;
    const y = row * cell;
    const outer = 7 * cell;
    const outerR = 10;
    const innerSize = 3 * cell;
    const innerX = x + 2 * cell;
    const innerY = y + 2 * cell;
    const innerR = 5;
    return (
      <g>
        {/* Outer filled rounded square */}
        <rect x={x} y={y} width={outer} height={outer} rx={outerR} fill={finderColor} />
        {/* White inset */}
        <rect x={x + cell} y={y + cell} width={5 * cell} height={5 * cell} rx={6} fill="#F4F3EF" />
        {/* Inner solid square */}
        <rect x={innerX} y={innerY} width={innerSize} height={innerSize} rx={innerR} fill={finderColor} />
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className="w-[200px] h-[200px]"
      aria-hidden="true"
      role="presentation"
    >
      {/* Data modules */}
      {grid.map((row, ri) =>
        row.map((val, ci) => {
          if (val !== 1) return null;
          const x = ci * cell + gap / 2;
          const y = ri * cell + gap / 2;
          const w = cell - gap;
          const isAccent = ri === 10 && ci === 10;
          return (
            <rect
              key={`${ri}-${ci}`}
              x={x} y={y} width={w} height={w}
              rx={2}
              fill={isAccent ? accent : dark}
            />
          );
        })
      )}

      {/* Finder patterns drawn on top as clean shapes */}
      <Finder col={0} row={0} />
      <Finder col={14} row={0} />
      <Finder col={0} row={14} />
    </svg>
  );
}
