import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Icon } from '../glass';
import { useAssistantStore } from '../../stores/useAssistantStore';

export interface AssistantFabProps {
  /**
   * When true, the button does NOT position itself absolutely — the caller
   * is responsible for placement (used on AR to avoid the instruction banner).
   */
  positioned?: boolean;
}

/**
 * Floating button that opens the AI assistant sheet.
 * Rendered on Landing, AR, Text, Arrival.
 *
 * Visually distinct from the rest of the cyan-glass system: a multi-hue
 * Gemini-style gradient (blue → purple → magenta → amber) with a slowly
 * rotating conic shimmer underneath. Carries a chat-bubble glyph instead
 * of a sparkle so it's unambiguously the chat affordance — addresses the
 * usability finding that the previous cyan circle was misread as a
 * brightness control on the AR screen.
 */
export function AssistantFab({ positioned = false }: AssistantFabProps) {
  const openSheet = useAssistantStore((s) => s.openSheet);
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={openSheet}
      aria-label={t('assistant.open_aria')}
      className={clsx(
        'relative w-14 h-14 rounded-full flex items-center justify-center press transition-smooth pulse-ai',
        !positioned && 'fixed right-4 z-30',
      )}
      style={{
        background:
          'linear-gradient(135deg, #4285F4 0%, #9B72CB 40%, #D96570 72%, #F9AB00 100%)',
        boxShadow:
          '0 14px 30px -8px rgba(155,114,203,0.55), 0 0 0 1px rgba(255,255,255,0.5) inset',
        ...(positioned
          ? null
          : { bottom: 'calc(2rem + env(safe-area-inset-bottom))' }),
      }}
    >
      {/* Slow conic-gradient shimmer rotating underneath — the "alive AI" feel.
          Positioned with negative inset + overflow:hidden on the parent disc
          via the rounded-full mask, so the rotation stays inside the circle. */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
      >
        <span
          className="absolute ai-shimmer-rotate"
          style={{
            inset: '-50%',
            background:
              'conic-gradient(from 0deg, rgba(66,133,244,0.85), rgba(155,114,203,0.85), rgba(217,101,112,0.85), rgba(249,171,0,0.85), rgba(66,133,244,0.85))',
            opacity: 0.5,
            filter: 'blur(6px)',
          }}
        />
      </span>

      {/* Glossy top highlight to give depth */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.4), transparent 55%)',
        }}
      />

      <Icon name="message" size={22} className="relative z-10 text-white" />
    </button>
  );
}
