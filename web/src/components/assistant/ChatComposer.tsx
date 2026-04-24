import clsx from 'clsx';
import { useState } from 'react';
import { Icon } from '../glass';

export interface ChatComposerProps {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (text: string) => void;
}

/**
 * Glass pill input + cyan send button. Clears on submit.
 */
export function ChatComposer({ placeholder, disabled = false, onSubmit }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const canSend = !disabled && value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 glass rounded-full px-4 py-2.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-[14px] text-[color:var(--navy)] placeholder:text-[color:var(--navy)]/45 disabled:opacity-60"
        />
      </div>
      <button
        onClick={submit}
        disabled={!canSend}
        aria-label="Send"
        className={clsx(
          'w-11 h-11 rounded-full flex items-center justify-center press transition-smooth',
          canSend ? 'cyan-glow' : 'glass-dim text-[color:var(--navy)]/40',
        )}
      >
        <Icon name="send" size={16} stroke={2.2} />
      </button>
    </div>
  );
}
