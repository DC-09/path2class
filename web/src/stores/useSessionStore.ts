import { create } from 'zustand';
import { storageService } from '../services/storageService';

export type Language = 'it' | 'en' | 'pt';
export type ArrowDirection = 'straight' | 'left' | 'right';

export interface SessionState {
  language: Language;
  accessibility: boolean;
  currentStep: number;
  arrowDirection: ArrowDirection;
  locationKey: string;

  setLanguage: (language: Language) => void;
  cycleLanguage: () => void;
  toggleAccessibility: () => void;
  setAccessibility: (value: boolean) => void;
  setCurrentStep: (step: number) => void;
  setArrowDirection: (direction: ArrowDirection) => void;
  setLocationKey: (key: string) => void;
  reset: () => void;
}

const LANGUAGE_CYCLE: Language[] = ['it', 'en', 'pt'];

function initialLanguage(): Language {
  const stored = storageService.getLanguage();
  if (stored) return stored;
  // Auto-detect from navigator on first visit; fall back to IT.
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : '';
  return (LANGUAGE_CYCLE as readonly string[]).includes(nav) ? (nav as Language) : 'it';
}

const defaults = {
  currentStep: 0,
  arrowDirection: 'straight' as ArrowDirection,
  locationKey: 'elevator_corridor_1f',
};

export const useSessionStore = create<SessionState>((set, get) => ({
  language: initialLanguage(),
  accessibility: storageService.getAccessibility(),
  ...defaults,

  setLanguage: (language) => {
    storageService.setLanguage(language);
    set({ language });
  },
  cycleLanguage: () => {
    const next =
      LANGUAGE_CYCLE[(LANGUAGE_CYCLE.indexOf(get().language) + 1) % LANGUAGE_CYCLE.length];
    storageService.setLanguage(next);
    set({ language: next });
  },
  toggleAccessibility: () => {
    const next = !get().accessibility;
    storageService.setAccessibility(next);
    set({ accessibility: next });
  },
  setAccessibility: (accessibility) => {
    storageService.setAccessibility(accessibility);
    set({ accessibility });
  },
  setCurrentStep: (currentStep) => set({ currentStep }),
  setArrowDirection: (arrowDirection) => set({ arrowDirection }),
  setLocationKey: (locationKey) => set({ locationKey }),
  reset: () =>
    set({
      ...defaults,
      // language + accessibility intentionally persist across resets
      language: get().language,
      accessibility: get().accessibility,
    }),
}));
