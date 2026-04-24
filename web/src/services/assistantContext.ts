import type { TFunction } from 'i18next';
import type { AssistantContext, AssistantMode } from './assistantService';
import type { Language } from '../stores/useSessionStore';
import corridor from '../data/corridor.json';

export interface BuildContextArgs {
  pathname: string;
  language: Language;
  accessibility: boolean;
  currentStep: number;
  t: TFunction;
}

function modeFromPath(pathname: string): AssistantMode {
  if (pathname.startsWith('/navigate/ar')) return 'ar';
  if (pathname.startsWith('/navigate/text')) return 'text';
  if (pathname.startsWith('/arrived')) return 'arrived';
  if (pathname.startsWith('/landing')) return 'landing';
  return 'other';
}

/**
 * Build the context object the edge function injects into the system prompt.
 * Reads from the corridor data + session state + current route.
 */
export function buildAssistantContext({
  pathname,
  language,
  accessibility,
  currentStep,
  t,
}: BuildContextArgs): AssistantContext {
  const mode = modeFromPath(pathname);
  const totalSteps = accessibility
    ? (t('text_nav.steps_accessible', { returnObjects: true }) as unknown[]).length
    : (t('text_nav.steps_standard', { returnObjects: true }) as unknown[]).length;

  let currentInstruction = '';
  if (mode === 'ar') {
    currentInstruction = accessibility
      ? t('ar.instruction_accessible')
      : t('ar.instruction_standard');
  } else if (mode === 'text') {
    const steps = (
      accessibility
        ? t('text_nav.steps_accessible', { returnObjects: true })
        : t('text_nav.steps_standard', { returnObjects: true })
    ) as Array<{ text: string }>;
    currentInstruction = steps[Math.min(currentStep, steps.length - 1)]?.text ?? '';
  } else if (mode === 'arrived') {
    currentInstruction = t('arrived.title');
  }

  return {
    location: `${t('landing.location_title')} · ${t('landing.location_sub')}`,
    destination: t('destination.title'),
    currentInstruction,
    mode,
    accessibility,
    language,
    currentStep: currentStep + 1,
    totalSteps,
    recentDetections: ['Room 17 W sign', accessibility ? 'Elevator door' : 'Direction arrow'],
    // ^ placeholder — when the real detectionService is live, this gets
    //   populated from the last few frames.
  };
}

export const corridorDebugInfo = corridor; // re-export for debug-only use
