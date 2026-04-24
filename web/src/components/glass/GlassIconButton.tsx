import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface GlassIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
  children?: ReactNode;
}

/**
 * GlassIconButton — circular glass button used for back/close/help actions in
 * top bars and AR control stack. `aria-label` is required for screen readers;
 * we enforce it at the usage site (no fallback string).
 */
export function GlassIconButton({
  size = 40,
  className,
  children,
  style,
  ...rest
}: GlassIconButtonProps) {
  return (
    <button
      className={clsx(
        'glass rounded-full flex items-center justify-center press transition-smooth',
        'text-[color:var(--navy)]',
        className,
      )}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
