import clsx from 'clsx';
import { GlassCard, Icon, type IconName } from '../glass';

export interface StepItem {
  icon: IconName;
  text: string;
}

export interface StepListProps {
  steps: StepItem[];
  currentIndex: number;
}

/**
 * Vertical list of route steps. Current step glows cyan; past steps fade out.
 * 1:1 port from the prototype's text-directions screen.
 */
export function StepList({ steps, currentIndex }: StepListProps) {
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <div
            key={i}
            className={clsx('transition-smooth', isPast && 'opacity-40')}
          >
            <GlassCard
              className={clsx(
                'p-3.5 flex items-center gap-3',
                isCurrent && 'ring-2 ring-[color:var(--cyan)]/50',
              )}
              style={
                isCurrent
                  ? {
                      boxShadow:
                        '0 0 28px rgba(123,196,217,0.45), inset 0 1px 0 rgba(255,255,255,0.55)',
                    }
                  : undefined
              }
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold tight',
                  isCurrent ? 'cyan-glow' : 'glass-dim text-[color:var(--navy)]',
                )}
              >
                {i + 1}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Icon
                  name={s.icon}
                  size={16}
                  className="text-[color:var(--navy)]/70 shrink-0"
                />
                <div className="text-[13px] text-[color:var(--navy)] leading-[1.4]">{s.text}</div>
              </div>
            </GlassCard>
          </div>
        );
      })}
    </div>
  );
}
