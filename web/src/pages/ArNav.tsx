import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AROverlay,
  CameraView,
  DeviationAlert,
  InstructionBanner,
  type CameraViewHandle,
} from '../components/ar';
import { AssistantFab } from '../components/assistant/AssistantFab';
import { GlassCard, Icon } from '../components/glass';
import { detectionService, type Detection } from '../services/detectionService';
import { useSessionStore } from '../stores/useSessionStore';

const DEVIATION_DURATION_MS = 2200;

/**
 * AR Navigation screen — real camera feed + AR overlay driven by the
 * detection service (MOCK for now; real YOLO plugs in behind the same API).
 */
export default function ArNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraViewHandle>(null);

  const accessibility = useSessionStore((s) => s.accessibility);
  const toggleAccessibility = useSessionStore((s) => s.toggleAccessibility);
  const arrowDirection = useSessionStore((s) => s.arrowDirection);
  const setArrowDirection = useSessionStore((s) => s.setArrowDirection);

  const [detections, setDetections] = useState<readonly Detection[]>([]);
  const [deviation, setDeviation] = useState(false);

  useEffect(() => {
    const unsubscribe = detectionService.subscribe((frame) => {
      setDetections(frame.detections);
    });
    detectionService.start();
    return () => {
      unsubscribe();
      detectionService.stop();
      setDetections([]);
    };
  }, []);

  useEffect(() => {
    if (!deviation) return;
    const timeoutId = window.setTimeout(() => {
      setDeviation(false);
      setArrowDirection(arrowDirection === 'left' ? 'straight' : 'left');
    }, DEVIATION_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
    // arrowDirection is read at scheduling time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviation]);

  const handleCameraError = useCallback(
    (err: Error) => {
      console.warn('[Path2Class] Camera unavailable, falling back to text mode:', err);
      navigate('/navigate/text', { replace: true });
    },
    [navigate],
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <CameraView ref={cameraRef} onError={handleCameraError} />

      <AROverlay
        arrowDirection={arrowDirection}
        detections={detections}
        accessibility={accessibility}
      />

      {/* Top status bar */}
      <div className="absolute top-12 left-4 right-4 z-20">
        <GlassCard className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--navy)]">
            <Icon name="pin" size={12} /> {t('ar.area_label')}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--cyan)] pulse-dot" />
            <span className="text-[10px] trk-wide uppercase font-semibold text-[color:var(--navy)]/70">
              {t('common.live')}
            </span>
          </div>
          <div className="flex items-center gap-1" aria-label={t('ar.progress_aria')}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < 2 ? 'bg-[color:var(--cyan)]' : 'bg-[color:var(--navy)]/20'
                }`}
              />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Floating controls (close / switch to text) */}
      <div className="absolute top-[92px] right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => navigate('/destination')}
          aria-label={t('ar.close_aria')}
          className="glass rounded-full w-11 h-11 flex items-center justify-center press transition-smooth"
        >
          <Icon name="x" size={18} />
        </button>
        <button
          onClick={() => navigate('/navigate/text')}
          aria-label={t('ar.switch_aria')}
          className="glass rounded-full w-11 h-11 flex items-center justify-center press transition-smooth"
        >
          <Icon name="switch" size={18} />
        </button>
      </div>

      {/* Instruction banner */}
      <div className="absolute left-4 right-4 bottom-20 z-20">
        <InstructionBanner
          icon={accessibility ? 'elevator' : 'arrow-up'}
          instruction={
            accessibility ? t('ar.instruction_accessible') : t('ar.instruction_standard')
          }
          nextLine={t('ar.next_line')}
          etaLabel={t('ar.eta_label')}
        />
      </div>

      {/* Demo controls pill */}
      <div className="absolute left-4 bottom-4 z-20">
        <div className="glass rounded-full px-2 py-1.5 flex items-center gap-1 text-[10px]">
          <span className="text-[color:var(--navy)]/50 trk-wide uppercase px-2">
            {t('ar.demo.label')}
          </span>
          <button
            onClick={() => setDeviation(true)}
            className="glass-dim rounded-full px-2.5 py-1 press transition-smooth text-[color:var(--navy)]"
          >
            {t('ar.demo.wrong_turn')}
          </button>
          <button
            onClick={() => navigate('/arrived')}
            className="glass-dim rounded-full px-2.5 py-1 press transition-smooth text-[color:var(--navy)]"
          >
            {t('ar.demo.arrive')}
          </button>
          <button
            onClick={toggleAccessibility}
            className="glass-dim rounded-full px-2.5 py-1 press transition-smooth text-[color:var(--navy)]"
          >
            {t('ar.demo.a11y')}
          </button>
        </div>
      </div>

      {deviation && <DeviationAlert />}

      <div className="absolute right-4 z-20" style={{ bottom: 180 }}>
        <AssistantFab positioned />
      </div>
    </div>
  );
}
