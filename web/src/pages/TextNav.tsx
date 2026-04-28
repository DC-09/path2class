import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlassButton, GlassCard, Icon, type IconName } from '../components/glass';
import { MiniFloorPlan } from '../components/text/MiniFloorPlan';
import { StepList, type StepItem } from '../components/text/StepList';
import { AssistantFab } from '../components/assistant/AssistantFab';
import { useSessionStore } from '../stores/useSessionStore';

interface LocalisedStep {
  icon: IconName;
  text: string;
}

/**
 * Text Navigation — linear step list + mini floor plan.
 * Step copy lives in the locale files (not corridor.json) so it translates
 * alongside the rest of the UI.
 */
export default function TextNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const accessibility = useSessionStore((s) => s.accessibility);
  const currentStep = useSessionStore((s) => s.currentStep);
  const setCurrentStep = useSessionStore((s) => s.setCurrentStep);

  const stepsKey = accessibility ? 'text_nav.steps_accessible' : 'text_nav.steps_standard';
  const raw = t(stepsKey, { returnObjects: true }) as LocalisedStep[];
  const steps: StepItem[] = raw.map((s) => ({ icon: s.icon, text: s.text }));

  // Reset step counter when entering the screen.
  useEffect(() => {
    setCurrentStep(0);
  }, [setCurrentStep]);

  const clamped = Math.min(currentStep, steps.length - 1);
  const isLast = clamped >= steps.length - 1;

  const advance = () => {
    if (isLast) {
      navigate('/arrived');
      return;
    }
    setCurrentStep(clamped + 1);
  };

  return (
    <div className="warm-bg relative h-[100dvh] fade-in flex flex-col">
      <div className="pt-14 px-5 flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/destination')}
          aria-label={t('common.back')}
          className="glass rounded-full w-10 h-10 flex items-center justify-center press transition-smooth"
        >
          <Icon name="chevron-left" size={20} />
        </button>
        <div className="text-[11px] trk-wide uppercase text-[color:var(--navy)]/60">
          {t('text_nav.eyebrow')}
        </div>
        <button
          onClick={() => navigate('/navigate/ar')}
          aria-label={t('ar.switch_aria')}
          className="glass rounded-full w-10 h-10 flex items-center justify-center press transition-smooth"
        >
          <Icon name="switch" size={18} />
        </button>
      </div>

      <div className="relative z-10 px-5 mt-3">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] trk-wide uppercase text-[color:var(--navy)]/55">
                {t('common.from')}
              </div>
              <div className="text-[13px] font-semibold text-[color:var(--navy)] tight">
                {t('text_nav.from_location')}
              </div>
            </div>
            <Icon
              name="chevron-right"
              size={18}
              className="text-[color:var(--navy)]/40"
            />
            <div>
              <div className="text-[10px] trk-wide uppercase text-[color:var(--navy)]/55 text-right">
                {t('common.to')}
              </div>
              <div className="text-[13px] font-semibold text-[color:var(--navy)] tight text-right">
                {t('destination.title')}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="relative z-10 px-5 mt-4 flex-1 overflow-y-auto no-scrollbar pb-2">
        <StepList steps={steps} currentIndex={clamped} />
      </div>

      <div className="relative z-10 px-5 mt-2">
        <GlassCard className="p-3">
          <div className="text-[10px] trk-wide uppercase text-[color:var(--navy)]/55 mb-1 px-1">
            {t('text_nav.floor_plan_title')}
          </div>
          <MiniFloorPlan accessibility={accessibility} stepIndex={clamped} />
        </GlassCard>
      </div>

      <div className="relative z-10 px-5 pb-8 pt-3">
        <GlassButton
          variant="cyan"
          onClick={advance}
          iconRight="check"
          className="w-full py-4 text-[14px] font-semibold"
        >
          {isLast ? t('text_nav.cta_arrived') : t('text_nav.cta_next')}
        </GlassButton>
      </div>

      <AssistantFab />
    </div>
  );
}
