import { GlassCard, Icon, type IconName } from '../glass';

export interface InstructionBannerProps {
  icon: IconName;
  instruction: string;
  nextLine?: string;
  etaLabel?: string;
}

/**
 * Bottom instruction banner — sticks above the home-indicator area.
 * 1:1 port from the prototype.
 */
export function InstructionBanner({
  icon,
  instruction,
  nextLine,
  etaLabel,
}: InstructionBannerProps) {
  return (
    <GlassCard className="p-4" strong>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl cyan-glow flex items-center justify-center shrink-0">
          <Icon name={icon} size={18} />
        </div>
        <div className="flex-1">
          <div className="text-[16px] font-semibold tight text-[color:var(--navy)]">
            {instruction}
          </div>
          {nextLine && (
            <div className="text-[11px] text-[color:var(--navy)]/60 mt-0.5">{nextLine}</div>
          )}
        </div>
        {etaLabel && (
          <div className="text-right">
            <div className="text-[10px] trk-wide uppercase text-[color:var(--navy)]/50">
              ETA
            </div>
            <div className="text-[14px] font-bold tight text-[color:var(--navy)]">
              {etaLabel}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
