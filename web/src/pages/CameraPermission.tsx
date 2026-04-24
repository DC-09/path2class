import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlassButton, GlassCard, Icon } from '../components/glass';

/**
 * CameraPermission — explains why the camera is needed before we actually
 * request it. The real `getUserMedia` call happens on the AR screen; a
 * denial there falls back to `/navigate/text`.
 */
export default function CameraPermission() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="warm-bg absolute inset-0 fade-in flex items-center justify-center px-6">
      <div className="relative z-10 w-full">
        <GlassCard className="p-6" strong radius="4xl">
          <div className="w-16 h-16 rounded-2xl cyan-glow flex items-center justify-center mx-auto">
            <Icon name="camera" size={28} />
          </div>
          <div className="text-[24px] font-semibold tight text-[color:var(--navy)] text-center mt-5">
            {t('permission.title')}
          </div>
          <div className="text-[14px] text-[color:var(--navy)]/75 text-center mt-2 leading-[1.55]">
            {t('permission.body')}
          </div>
          <div className="space-y-2.5 mt-6">
            <GlassButton
              variant="cyan"
              onClick={() => navigate('/navigate/ar')}
              className="w-full py-3.5 text-[15px] font-semibold"
            >
              {t('permission.allow')}
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/navigate/text')}
              className="w-full py-3.5 text-[14px]"
            >
              {t('permission.use_text')}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
