import clsx from 'clsx';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type TailwindRadius = 'xl' | '2xl' | '3xl' | '4xl';

// Full class literals so Tailwind JIT picks them up at scan time.
const RADIUS_CLASS: Record<TailwindRadius, string> = {
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  '4xl': 'rounded-4xl', // 32px, configured in tailwind.config.js
};

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  radius?: TailwindRadius;
  /** Stronger glass (higher bg opacity + blur) — see prototype `glass-strong`. */
  strong?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * GlassCard — Liquid Glass surface (translucent + backdrop-blur + hairline border +
 * inset top highlight). 1:1 port of `GlassCard` from PROTOTYPE_REFERENCE.html.
 */
export function GlassCard({
  children,
  radius = '3xl',
  strong = false,
  className,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={clsx(strong ? 'glass-strong' : 'glass', RADIUS_CLASS[radius], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
