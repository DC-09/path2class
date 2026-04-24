import { useTranslation } from 'react-i18next';
import { GlassCard, Icon } from '../glass';

/**
 * Full-screen coral-tinted modal shown when the user walks off-route.
 * Self-contained: it animates in (fade-in) and the ring sweeps over 2s.
 * The parent owns the lifecycle (mount/unmount) after recalculation.
 */
export function DeviationAlert() {
  const { t } = useTranslation();

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label={t('ar.deviation.aria')}
      className="absolute inset-0 z-30 fade-in flex items-center justify-center px-6"
      style={{ background: 'rgba(232,106,92,0.22)', backdropFilter: 'blur(8px)' }}
    >
      <GlassCard className="p-6 text-center w-full" strong radius="4xl">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto coral-glow"
          style={{ background: 'linear-gradient(180deg,#F59287,#E86A5C)', color: '#fff' }}
        >
          <Icon name="alert" size={28} />
        </div>
        <div className="text-[22px] font-semibold tight text-[color:var(--navy)] mt-4">
          {t('ar.deviation.title')}
        </div>
        <div className="text-[13px] text-[color:var(--navy)]/70 mt-1.5">
          {t('ar.deviation.body')}
        </div>
        <div className="mt-5 flex justify-center">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#1E3A5F"
              strokeOpacity="0.12"
              strokeWidth="4"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#7BC4D9"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="138"
              strokeDashoffset="138"
              transform="rotate(-90 28 28)"
              style={{ animation: 'draw-ring 2s linear forwards' }}
            />
          </svg>
        </div>
      </GlassCard>
    </div>
  );
}
