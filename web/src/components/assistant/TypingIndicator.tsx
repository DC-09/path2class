import { Icon } from '../glass';

/**
 * Three pulsing dots, shown between send and first token arriving.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 fade-in">
      <div className="w-7 h-7 rounded-full glass-dim flex items-center justify-center shrink-0 mb-1">
        <Icon name="sparkle" size={12} className="text-[color:var(--navy)]" />
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-3xl rounded-bl-md glass-strong w-fit">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[color:var(--navy)]/60 typing-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
