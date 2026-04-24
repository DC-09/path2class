import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../glass';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { SuggestionChips } from './SuggestionChips';
import { ChatComposer } from './ChatComposer';
import { useAssistantStore } from '../../stores/useAssistantStore';
import { useSessionStore } from '../../stores/useSessionStore';
import {
  MissingEndpointError,
  streamAssistant,
} from '../../services/assistantService';
import { buildAssistantContext } from '../../services/assistantContext';

/**
 * Slide-up bottom sheet with the streaming AI chat.
 * Mounted at root; its visibility is driven by `useAssistantStore.open`.
 */
export function AssistantSheet() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const open = useAssistantStore((s) => s.open);
  const close = useAssistantStore((s) => s.closeSheet);
  const messages = useAssistantStore((s) => s.messages);
  const isTyping = useAssistantStore((s) => s.isTyping);
  const streaming = useAssistantStore((s) => s.streaming);
  const appendMessage = useAssistantStore((s) => s.appendMessage);
  const setIsTyping = useAssistantStore((s) => s.setIsTyping);
  const setStreaming = useAssistantStore((s) => s.setStreaming);

  const language = useSessionStore((s) => s.language);
  const accessibility = useSessionStore((s) => s.accessibility);
  const currentStep = useSessionStore((s) => s.currentStep);

  const welcome = t('assistant.welcome');
  const showWelcome = messages.length === 0;

  // Auto-scroll to the bottom as new content arrives.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming, isTyping]);

  // Abort any in-flight request when the sheet is closed or unmounted.
  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [open]);

  // ESC closes the sheet — standard modal affordance.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const suggestions = useMemo(
    () => pickSuggestions(location.pathname),
    [location.pathname],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || streaming) return;

      appendMessage({ role: 'user', content: trimmed });
      setIsTyping(true);
      setStreaming('');

      const controller = new AbortController();
      abortRef.current = controller;

      const context = buildAssistantContext({
        pathname: location.pathname,
        language,
        accessibility,
        currentStep,
        t,
      });

      try {
        let first = true;
        let draft = '';
        await streamAssistant({
          message: trimmed,
          context,
          // Exclude the just-added user message — the edge function gets it
          // as `message`, and history should stop before that point.
          history: messages,
          signal: controller.signal,
          onToken: (token) => {
            if (first) {
              setIsTyping(false);
              first = false;
            }
            draft += token;
            setStreaming(draft);
          },
        });
        appendMessage({ role: 'assistant', content: draft });
        setStreaming('');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const fallback = errorMessage(err, language);
        appendMessage({ role: 'assistant', content: fallback });
        setStreaming('');
      } finally {
        setIsTyping(false);
        abortRef.current = null;
      }
    },
    [
      isTyping,
      streaming,
      appendMessage,
      setIsTyping,
      setStreaming,
      location.pathname,
      language,
      accessibility,
      currentStep,
      messages,
      t,
    ],
  );

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40" onClick={close}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('assistant.open_aria')}
        className="absolute left-0 right-0 bottom-0 slide-up"
        style={{ height: '70%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="glass-strong h-full flex flex-col"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottom: 'none',
            background: 'rgba(255,255,255,0.62)',
          }}
        >
          {/* drag handle */}
          <div className="pt-2.5 flex justify-center">
            <div className="w-9 h-1 rounded-full bg-[color:var(--navy)]/25" />
          </div>

          {/* header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full glass-dim flex items-center justify-center">
                <Icon name="sparkle" size={15} className="text-[color:var(--navy)]" />
              </div>
              <div>
                <div className="text-[16px] font-semibold tight text-[color:var(--navy)]">
                  {assistantTitle(i18n.language)}
                </div>
                <div className="text-[10px] text-[color:var(--navy)]/55">
                  On-corridor help · Path2Class
                </div>
              </div>
            </div>
            <button
              onClick={close}
              aria-label={t('common.close')}
              className="glass rounded-full w-9 h-9 flex items-center justify-center press"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-3"
          >
            {showWelcome && (
              <ChatMessage message={{ role: 'assistant', content: welcome }} />
            )}
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
            {isTyping && <TypingIndicator />}
            {streaming && (
              <ChatMessage
                message={{
                  role: 'assistant',
                  content: streaming + '▋',
                }}
              />
            )}
          </div>

          <SuggestionChips suggestions={suggestions} onPick={send} />

          <div className="px-4 pb-5 pt-1">
            <ChatComposer
              placeholder={composerPlaceholder(i18n.language)}
              disabled={isTyping || Boolean(streaming)}
              onSubmit={send}
            />
            <div className="text-[10px] text-[color:var(--navy)]/40 text-center mt-1.5">
              AI can make mistakes · responses are streamed live
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers (kept local; no need to expose) ---------- */

function pickSuggestions(pathname: string): string[] {
  if (pathname.startsWith('/navigate/ar')) {
    return ['Simplify', 'What do I see?', 'How much longer?'];
  }
  if (pathname.startsWith('/navigate/text')) {
    return ['Simplify', 'Switch to AR', "I'm confused"];
  }
  if (pathname.startsWith('/arrived')) {
    return ['How do I go back?', 'Thanks!'];
  }
  if (pathname.startsWith('/landing')) {
    return ['How do I get to 21 W?', "Where's the elevator?", 'Accessible route'];
  }
  return ['Help'];
}

function composerPlaceholder(lang: string): string {
  if (lang.startsWith('it')) return 'Chiedimi qualcosa...';
  if (lang.startsWith('pt')) return 'Pergunte algo...';
  return 'Ask anything...';
}

function assistantTitle(lang: string): string {
  if (lang.startsWith('it')) return 'Assistente';
  if (lang.startsWith('pt')) return 'Assistente';
  return 'Assistant';
}

function errorMessage(err: unknown, lang: string): string {
  if (err instanceof MissingEndpointError) {
    if (lang.startsWith('it'))
      return "L'assistente non è configurato (manca VITE_ASSISTANT_ENDPOINT). Vedi il README.";
    if (lang.startsWith('pt'))
      return 'O assistente não está configurado (falta VITE_ASSISTANT_ENDPOINT). Veja o README.';
    return 'The assistant is not configured (VITE_ASSISTANT_ENDPOINT missing). See the README.';
  }
  if (lang.startsWith('it'))
    return 'Qualcosa è andato storto contattando l\'assistente. Riprova tra poco.';
  if (lang.startsWith('pt'))
    return 'Algo deu errado ao contatar o assistente. Tente novamente em breve.';
  return 'Something went wrong reaching the assistant. Please try again shortly.';
}
