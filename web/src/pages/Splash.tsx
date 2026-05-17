import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlassButton, GlassCard, Icon } from '../components/glass';
import type { IconName } from '../components/glass';

/**
 * Splash — welcome screen shown after the QR is scanned. Presents the brand
 * and a 3-step explainer, then sends the user to /landing via "Get started".
 *
 * Forwards the `?loc=` deeplink to /landing so the QR can still pre-fill
 * the location key.
 */
export default function Splash() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const loc = params.get('loc');

  const steps: { icon: IconName; key: 'search' | 'follow' | 'arrive' }[] = [
    { icon: 'search', key: 'search' },
    { icon: 'camera', key: 'follow' },
    { icon: 'check', key: 'arrive' },
  ];

  const onGetStarted = () => {
    navigate(loc ? `/landing?loc=${encodeURIComponent(loc)}` : '/landing');
  };

  return (
    <div className="warm-bg relative min-h-[100dvh] fade-in overflow-y-auto no-scrollbar">
      <div className="relative z-10 pt-16 flex flex-col items-center">
        <div className="float-y">
          <img
            src="/logo-splash.png"
            alt="Path2Class"
            className="h-20 w-auto select-none"
            style={{
              filter:
                'drop-shadow(0 18px 28px rgba(30, 58, 95, 0.18)) drop-shadow(0 4px 8px rgba(35, 186, 206, 0.18))',
            }}
            draggable={false}
          />
        </div>
      </div>

      <div className="relative z-10 px-7 mt-5 text-center">
        <div
          className="text-[23px] font-semibold tight text-[color:var(--navy)] leading-[1.2]"
          style={{ textWrap: 'balance' }}
        >
          {t('splash.hero_title')}
        </div>
        <div
          className="text-[13px] text-[color:var(--navy)]/70 mt-3 leading-[1.55]"
          style={{ textWrap: 'pretty' }}
        >
          <span className="font-semibold text-[color:var(--navy)]">
            path<span style={{ color: '#23BACE' }}>2</span>class
          </span>{' '}
          {t('splash.hero_subtitle')}
        </div>
      </div>

      <div className="relative z-10 px-5 mt-6 space-y-2.5">
        {steps.map((s, i) => (
          <GlassCard key={s.key} className="p-3.5 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl cyan-glow flex items-center justify-center">
                <Icon name={s.icon} size={18} />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full glass-strong flex items-center justify-center text-[10px] font-bold tight text-[color:var(--navy)]">
                {i + 1}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold tight text-[color:var(--navy)]">
                {t(`splash.steps.${s.key}.title`)}
              </div>
              <div className="text-[11.5px] text-[color:var(--navy)]/65 leading-[1.4] mt-0.5">
                {t(`splash.steps.${s.key}.body`)}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="relative z-10 px-5 mt-5 pb-10 flex flex-col items-center gap-2.5">
        <GlassButton
          variant="cyan"
          iconRight="chevron-right"
          onClick={onGetStarted}
          className="w-full py-4 text-[15px] font-semibold"
        >
          {t('splash.get_started')}
        </GlassButton>
      </div>
    </div>
  );
}
