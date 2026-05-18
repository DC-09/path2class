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

  const suggestions = useMemo(() => {
    const startChip = t('assistant.guided.start_chip');
    return [{ id: startChip, label: startChip }, ...pickSuggestions(location.pathname)];
  }, [location.pathname, t]);

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

  const onChipPick = useCallback(
    (label: string) => send(label),
    [send],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" onClick={close}>
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
          className="h-full flex flex-col"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            background: 'rgba(244,243,239,0.97)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow: '0 -8px 40px -4px rgba(30,58,95,0.15), 0 0 0 1px rgba(255,255,255,0.6) inset',
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

          <SuggestionChips
            suggestions={suggestions.map((s) => s.label)}
            onPick={onChipPick}
          />

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

function pickSuggestions(pathname: string): { id: string; label: string }[] {
  if (pathname.startsWith('/navigate/ar')) {
    return [
      { id: 'Simplify', label: 'Simplify' },
      { id: 'What do I see?', label: 'What do I see?' },
      { id: 'How much longer?', label: 'How much longer?' },
    ];
  }
  if (pathname.startsWith('/navigate/text')) {
    return [
      { id: 'Simplify', label: 'Simplify' },
      { id: 'Switch to AR', label: 'Switch to AR' },
      { id: "I'm confused", label: "I'm confused" },
    ];
  }
  if (pathname.startsWith('/arrived')) {
    return [
      { id: 'How do I go back?', label: 'How do I go back?' },
      { id: 'Thanks!', label: 'Thanks!' },
    ];
  }
  if (pathname.startsWith('/landing')) {
    return [
      { id: 'How do I get to 124?', label: 'How do I get to 124?' },
      { id: "Where's the elevator?", label: "Where's the elevator?" },
      { id: 'Accessible route', label: 'Accessible route' },
    ];
  }
  return [{ id: 'Help', label: 'Help' }];
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
    if (lang === 'it') return "Assistente non configurato. Imposta VITE_ASSISTANT_ENDPOINT in .env.local.";
    if (lang === 'pt') return 'Assistente não configurado. Defina VITE_ASSISTANT_ENDPOINT em .env.local.';
    return 'Assistant not configured. Set VITE_ASSISTANT_ENDPOINT in .env.local.';
  }
  if (lang === 'it') return 'Errore di rete. Riprova tra poco.';
  if (lang === 'pt') return 'Erro de rede. Tente novamente.';
  return 'Network error. Please try again.';
}
