import type { SVGProps } from 'react';

/**
 * Icon — inline SVG glyphs copied verbatim from PROTOTYPE_REFERENCE.html.
 * Keeping the paths pixel-identical is a hard constraint; that's why we
 * ship our own component instead of using lucide icons for these glyphs.
 */

export type IconName =
  | 'pin'
  | 'globe'
  | 'wheelchair'
  | 'search'
  | 'chevron-right'
  | 'chevron-left'
  | 'clock'
  | 'sparkle'
  | 'camera'
  | 'x'
  | 'arrow-up'
  | 'switch'
  | 'help'
  | 'alert'
  | 'check'
  | 'send'
  | 'door'
  | 'elevator'
  | 'stairs'
  | 'flag'
  | 'bookmark'
  | 'message'
  | 'ban'
  | 'plus'
  | 'home'
  | 'refresh';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke'> {
  name: IconName;
  size?: number;
  stroke?: number;
}

export function Icon({ name, size = 20, stroke = 1.75, className = '', ...rest }: IconProps) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    ...rest,
  };

  switch (name) {
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </svg>
      );
    case 'wheelchair':
      return (
        <svg {...common}>
          <circle cx="12" cy="4" r="1.5" />
          <path d="M10 6v5h5l3 6" />
          <path d="M14 17a5 5 0 1 1-7-5" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case 'chevron-left':
      return (
        <svg {...common}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg {...common}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case 'switch':
      return (
        <svg {...common}>
          <path d="M4 8h13l-3-3M20 16H7l3 3" />
        </svg>
      );
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3 2 20h20z" />
          <path d="M12 10v5M12 18v.5" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 5 5 9-11" />
        </svg>
      );
    case 'send':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'door':
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="1" />
          <circle cx="15" cy="12" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'elevator':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M12 3v18M9 9l-2 2 2 2M15 15l2-2-2-2" />
        </svg>
      );
    case 'stairs':
      return (
        <svg {...common}>
          <path d="M3 21h4v-4h4v-4h4V9h4V5h4" />
        </svg>
      );
    case 'flag':
      return (
        <svg {...common}>
          <path d="M4 21V4h13l-2 4 2 4H4" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      );
    case 'message':
      return (
        <svg {...common}>
          <path d="M4 5h16v12H8l-4 4z" />
        </svg>
      );
    case 'ban':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m5 5 14 14" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      );
    default:
      return null;
  }
}
