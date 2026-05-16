import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import corridor from '../data/corridor.json';
import { GlassButton, GlassCard, Icon } from '../components/glass';
import { DoorArt } from '../components/art/DoorArt';
import { useSessionStore } from '../stores/useSessionStore';

export default function Destination() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const accessibility = useSessionStore((s) => s.accessibility);

  const eta = accessibility
    ? corridor.destination.etaMinutes.accessible
    : corridor.destination.etaMinutes.standard;

  return (
    <div className="warm-bg relative min-h-[100dvh] fade-in flex flex-col pb-8">
      <div className="pt-14 px-5 flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/landing')}
          aria-label={t('common.back')}
          className="glass rounded-full w-10 h-10 flex items-center justify-center press transition-smooth"
        >
          <Icon name="chevron-left" size={20} />
        </button>
        <div className="text-[11px] trk-wide uppercase text-[color:var(--navy)]/60">
          {t('destination.eyebrow')}
        </div>
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 px-5 pt-4 flex flex-col">
        <GlassCard className="overflow-hidden" radius="4xl" strong>
          <div className="h-[180px] overflow-hidden">
            <DoorArt number="124" />
          </div>
          <div className="p-5">
            {accessibility && (
              <div className="amber-glow inline-flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-[11px] font-semibold text-[color:var(--navy)] mb-3">
                <Icon name="wheelchair" size={13} /> {t('destination.accessible_chip')}
              </div>
            )}
            <div className="text-[28px] font-semibold tight text-[color:var(--navy)] leading-tight">
              {t('destination.title')}
            </div>
            <div className="text-[13px] text-[color:var(--navy)]/70 mt-1">
              {t('destination.meta')}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="glass rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--navy)]">
                <Icon name="clock" size={13} /> {t('destination.eta_minutes', { minutes: eta })}
              </div>
              <div className="glass rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--navy)]">
                <Icon name="pin" size={13} />{' '}
                {t('destination.distance_meters', { m: corridor.destination.distanceMeters })}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="mt-5 space-y-3">
          <GlassButton
            variant="cyan"
            icon="camera"
            onClick={() => navigate('/permission')}
            className="w-full py-4 text-[15px] font-semibold"
          >
            {t('destination.cta_ar')}
          </GlassButton>
          <GlassButton
            onClick={() => navigate('/navigate/text')}
            className="w-full py-4 text-[14px]"
          >
            {t('destination.cta_text')}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
