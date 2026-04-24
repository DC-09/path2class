import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlassButton, GlassCard } from '../components/glass';
import { QRArt } from '../components/art/QRArt';

/**
 * Splash — entry screen. In production the QR scan drives the real entry,
 * but the Simulate button lets us drive the flow without a printed code.
 */
export default function Splash() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="warm-bg absolute inset-0 flex flex-col items-center justify-between py-24 fade-in">
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <div className="text-[32px] font-bold tight text-[color:var(--navy)]">Path2Class</div>
        <div className="text-[13px] text-[color:var(--navy)]/70 mt-1.5 trk-wide uppercase">
          {t('splash.tagline')}
        </div>
      </div>

      <div className="relative z-10 float-y">
        <GlassCard className="w-[280px] h-[280px] flex items-center justify-center">
          <QRArt />
        </GlassCard>
      </div>

      <div className="relative z-10 px-8 w-full flex flex-col items-center gap-3">
        <GlassButton
          variant="cyan"
          icon="camera"
          onClick={() => navigate('/landing')}
          className="w-full py-4 text-[15px] font-semibold"
        >
          {t('splash.simulate_qr')}
        </GlassButton>
        <div className="text-[11px] text-[color:var(--navy)]/50 trk-wide uppercase">
          {t('splash.campus_name')}
        </div>
      </div>
    </div>
  );
}
