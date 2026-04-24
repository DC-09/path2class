export interface SuggestionChipsProps {
  suggestions: string[];
  onPick: (text: string) => void;
}

/**
 * Horizontal scroll row of context-specific prompt suggestions.
 * Wrapped as buttons — tapping a chip submits the text immediately.
 */
export function SuggestionChips({ suggestions, onPick }: SuggestionChipsProps) {
  return (
    <div className="px-4 pt-1 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="glass rounded-full px-3 py-1.5 whitespace-nowrap text-[12px] font-medium text-[color:var(--navy)] press transition-smooth shrink-0"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
