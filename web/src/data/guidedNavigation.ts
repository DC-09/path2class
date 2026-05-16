/**
 * Preset, deterministic Q&A flow that guides the user to Room 124 without
 * needing the LLM. Each step shows a question; the user replies with Sì/No
 * (buttons or free text). "Yes" advances to the next step; "No" repeats
 * the same step with a help message.
 *
 * Localised strings live under `assistant.guided.*` in the i18n locales.
 */
export interface GuidedStep {
  /** 1-based id, matches the user-visible step numbering. */
  id: number;
  /** When true this is the terminal arrival step (no more questions). */
  arrived?: boolean;
}

export const GUIDED_STEPS: GuidedStep[] = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
];

export const GUIDED_TOTAL_STEPS = GUIDED_STEPS.length;

/**
 * Interpret a free-text user reply as a yes/no answer. Keyword based —
 * good enough for the guided flow; the LLM is not consulted here.
 */
export function interpretYesNo(text: string): 'yes' | 'no' | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const yesRe = /\b(s[ìi]|yes|yep|sim|ok|okay|certo|vedo|c'?[èe]|esato|esatto|confermo|chegou|aqui|right|correct)\b/i;
  const noRe = /\b(no|nope|n[aã]o|non\s+vedo|non\s+riesco|non\s+ci\s+sono|niente|nothing|cannot)\b/i;
  if (yesRe.test(t)) return 'yes';
  if (noRe.test(t)) return 'no';
  return null;
}
