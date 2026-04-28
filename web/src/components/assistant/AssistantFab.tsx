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
 * Floating sparkle that opens the AI assistant sheet.
 * Rendered on Landing, AR, Text, Arrival.
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
        'w-14 h-14 rounded-full cyan-glow flex items-center justify-center press transition-smooth',
        !positioned && 'fixed right-4 z-30',
      )}
      style={{
        boxShadow:
          '0 14px 30px -8px rgba(123,196,217,0.7), 0 0 0 1px rgba(255,255,255,0.45) inset',
        ...(positioned
          ? null
          : { bottom: 'calc(2rem + env(safe-area-inset-bottom))' }),
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full pulse-cyan opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(168,227,245,0.55), transparent 70%)',
        }}
      />
      <Icon name="sparkle" size={22} className="relative z-10 text-[color:var(--navy)]" />
    </button>
  );
}
