import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AROverlay,
  CameraView,
  DeviationAlert,
  type CameraViewHandle,
} from '../components/ar';
import { AssistantFab } from '../components/assistant/AssistantFab';
import { GlassCard, Icon } from '../components/glass';
import { detectionService } from '../services/detectionService';
import { useSessionStore } from '../stores/useSessionStore';
import { useStepAdvancer, type NavigationStep } from '../hooks/useStepAdvancer';
import corridor from '../data/corridor.json';

const DEVIATION_DURATION_MS = 2200;
const STEPS = corridor.steps as NavigationStep[];

/**
 * AR Navigation screen — real camera feed + AR overlay driven by the
 * detection service. The current step from corridor.json controls the
 * arrow direction and instruction; useStepAdvancer auto-advances steps
 * when YOLO sees the configured trigger class for N consecutive frames.
 */
export default function ArNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraViewHandle>(null);

  const currentStep = useSessionStore((s) => s.currentStep);
  const setCurrentStep = useSessionStore((s) => s.setCurrentStep);
  const setArrowDirection = useSessionStore((s) => s.setArrowDirection);

  const [deviation, setDeviation] = useState(false);

  const step = STEPS[currentStep] ?? STEPS[STEPS.length - 1];

  useEffect(() => {
    setCurrentStep(0);
  }, [setCurrentStep]);

  useEffect(() => {
    setArrowDirection(step.arrow);
  }, [step.arrow, setArrowDirection]);

  useEffect(() => {
    detectionService.start();
    return () => detectionService.stop();
  }, []);

  const handleArrived = useCallback(() => {
    navigate('/arrived');
  }, [navigate]);

  const handleDeviation = useCallback(() => {
    setDeviation(true);
  }, []);

  useStepAdvancer({
    steps: STEPS,
    currentStep,
    onAdvance: setCurrentStep,
    onArrived: handleArrived,
    onDeviation: handleDeviation,
  });

  useEffect(() => {
    if (!deviation) return;
    const timeoutId = window.setTimeout(() => setDeviation(false), DEVIATION_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
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

      <AROverlay arrowDirection={step.arrow} />

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
            {STEPS.filter((s) => s.kind === 'ar').map((s) => (
              <span
                key={s.id}
                className={`w-1.5 h-1.5 rounded-full ${
                  s.id <= currentStep ? 'bg-[color:var(--cyan)]' : 'bg-[color:var(--navy)]/20'
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

      {step.notice && (
        <div
          className="absolute left-4 right-4 z-20 fade-in pointer-events-none"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <GlassCard className="px-4 py-3 flex items-center justify-center gap-3 cyan-glow">
            <Icon name="pin" size={16} className="text-[color:var(--cyan)]" />
            <div className="text-[13px] font-semibold text-[color:var(--navy)] tight">
              {t(`ar.notice.${step.notice}`)}
            </div>
          </GlassCard>
        </div>
      )}

      {deviation && <DeviationAlert />}

      <div className="absolute right-4 z-20" style={{ bottom: 180 }}>
        <AssistantFab positioned />
      </div>
    </div>
  );
}
