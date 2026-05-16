export interface DoorArtProps {
  number?: string;
}

/**
 * Hero door illustration used on Destination and Arrival.
 * 1:1 port from PROTOTYPE_REFERENCE.html.
 */
export function DoorArt({ number = '124' }: DoorArtProps) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true" role="presentation">
      <defs>
        <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8DFC9" />
          <stop offset="1" stopColor="#C9BE9E" />
        </linearGradient>
        <linearGradient id="dp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a5575" />
          <stop offset="1" stopColor="#1E3A5F" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" fill="url(#dg)" />
      {/* frame */}
      <rect x="56" y="22" width="128" height="130" rx="3" fill="#8a7f65" opacity="0.35" />
      <rect x="62" y="28" width="116" height="124" rx="2" fill="#F4F3EF" />
      {/* two door panels */}
      <rect x="66" y="32" width="54" height="116" rx="1" fill="url(#dp)" />
      <rect x="122" y="32" width="54" height="116" rx="1" fill="url(#dp)" />
      {/* panel insets */}
      <rect x="72" y="40" width="42" height="38" rx="1" fill="none" stroke="#A8C0D8" strokeOpacity="0.25" />
      <rect x="72" y="82" width="42" height="60" rx="1" fill="none" stroke="#A8C0D8" strokeOpacity="0.25" />
      <rect x="128" y="40" width="42" height="38" rx="1" fill="none" stroke="#A8C0D8" strokeOpacity="0.25" />
      <rect x="128" y="82" width="42" height="60" rx="1" fill="none" stroke="#A8C0D8" strokeOpacity="0.25" />
      {/* handles */}
      <rect x="114" y="82" width="3" height="14" rx="1" fill="#F5B946" />
      <rect x="123" y="82" width="3" height="14" rx="1" fill="#F5B946" />
      {/* number plate */}
      <rect x="92" y="46" width="56" height="22" rx="3" fill="#F4F3EF" stroke="#1E3A5F" strokeOpacity="0.2" />
      <text
        x="120"
        y="62"
        textAnchor="middle"
        fontFamily="Inter"
        fontWeight="700"
        fontSize="13"
        fill="#1E3A5F"
      >
        {number}
      </text>
    </svg>
  );
}
