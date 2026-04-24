import { Icon } from '../glass';
import type { ChatMessage as ChatMessageData } from '../../stores/useAssistantStore';

export interface ChatMessageProps {
  message: ChatMessageData;
}

/**
 * One chat bubble — user (right, cyan gradient) or assistant (left, glass-strong).
 * Matches the prototype's bubble style 1:1.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end fade-in">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-3xl rounded-br-md text-[14px] text-[color:var(--navy)] leading-[1.45]"
          style={{
            background:
              'linear-gradient(135deg, rgba(123,196,217,0.42), rgba(95,177,201,0.34))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 fade-in">
      <div className="w-7 h-7 rounded-full glass-dim flex items-center justify-center shrink-0 mb-1">
        <Icon name="sparkle" size={12} className="text-[color:var(--navy)]" />
      </div>
      <div
        className="max-w-[85%] px-4 py-2.5 rounded-3xl rounded-bl-md text-[14px] text-[color:var(--navy)] leading-[1.45] glass-strong"
        style={{ background: 'rgba(255,255,255,0.62)' }}
      >
        {message.content}
      </div>
    </div>
  );
}
