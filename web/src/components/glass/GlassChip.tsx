import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type GlassChipTone = 'cyan' | 'amber';

export interface GlassChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: GlassChipTone;
  icon?: IconName;
  children?: ReactNode;
}

/**
 * GlassChip — small pill (e.g. language, accessibility).
 * When `active`, ring/glow reflects the tone (cyan or amber).
 * 1:1 port from PROTOTYPE_REFERENCE.html.
 */
export function GlassChip({
  active = false,
  tone = 'cyan',
  icon,
  children,
  className,
  ...rest
}: GlassChipProps) {
  const activeRing =
    tone === 'amber' ? 'pulse-amber' : 'ring-2 ring-[color:var(--cyan)]/40';

  return (
    <button
      className={clsx(
        'transition-smooth press glass rounded-full px-3 py-1.5 inline-flex items-center gap-1.5',
        'text-[12px] font-medium text-[color:var(--navy)]',
        active && activeRing,
        className,
      )}
      aria-pressed={active}
      {...rest}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}
