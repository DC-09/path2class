import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type GlassButtonVariant = 'glass' | 'cyan' | 'ghost';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

/**
 * GlassButton — pill-shaped button with three variants:
 *  - cyan  : primary CTA with cyan-glow fill
 *  - glass : translucent glass (default)
 *  - ghost : dimmer, used for secondary actions
 * 1:1 port from PROTOTYPE_REFERENCE.html.
 */
export function GlassButton({
  variant = 'glass',
  icon,
  iconRight,
  children,
  className,
  ...rest
}: GlassButtonProps) {
  const base =
    'transition-smooth press inline-flex items-center justify-center gap-2 font-medium tight rounded-full';
  const variantClass =
    variant === 'cyan'
      ? 'cyan-glow'
      : variant === 'ghost'
        ? 'glass-dim text-[color:var(--navy)]'
        : 'glass text-[color:var(--navy)]';

  return (
    <button className={clsx(base, variantClass, className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}
