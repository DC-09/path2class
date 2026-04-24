/**
 * Stylised geometric QR glyph for the Splash card.
 * Not a scannable QR — decorative only.
 * 1:1 port from PROTOTYPE_REFERENCE.html.
 */
export function QRArt() {
  return (
    <svg viewBox="0 0 120 120" className="w-[180px] h-[180px]" aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E3A5F" />
          <stop offset="1" stopColor="#4B6B8F" />
        </linearGradient>
      </defs>
      {[
        [8, 8],
        [84, 8],
        [8, 84],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="28" height="28" rx="6" fill="url(#qg)" />
          <rect x={x + 6} y={y + 6} width="16" height="16" rx="3" fill="#F4F3EF" />
          <rect x={x + 10} y={y + 10} width="8" height="8" rx="1.5" fill="#1E3A5F" />
        </g>
      ))}
      {Array.from({ length: 40 }).map((_, i) => {
        const cx = 40 + (i % 5) * 8;
        const cy = 44 + Math.floor(i / 5) * 8;
        const on = [1, 3, 5, 7, 9, 12, 15, 17, 20, 22, 24, 27, 30, 33, 35, 38].includes(i);
        return on ? <rect key={i} x={cx} y={cy} width="6" height="6" rx="1.5" fill="#1E3A5F" /> : null;
      })}
      <rect x="44" y="84" width="10" height="10" rx="2" fill="#7BC4D9" />
      <rect x="60" y="88" width="6" height="6" rx="1.5" fill="#1E3A5F" />
      <rect x="72" y="84" width="10" height="10" rx="2" fill="#1E3A5F" />
    </svg>
  );
}
