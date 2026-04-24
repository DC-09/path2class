/**
 * assistantService — talks to the Supabase Edge Function that proxies
 * Anthropic's Messages API with SSE streaming.
 *
 * Endpoint is configured via `VITE_ASSISTANT_ENDPOINT`. In local dev the
 * caller gets `MissingEndpointError` so the UI can show a friendly message.
 */
import type { ChatMessage } from '../stores/useAssistantStore';
import type { Language } from '../stores/useSessionStore';

export type AssistantMode = 'ar' | 'text' | 'landing' | 'arrived' | 'other';

export interface AssistantContext {
  location: string;
  destination: string;
  currentInstruction: string;
  mode: AssistantMode;
  accessibility: boolean;
  language: Language;
  currentStep?: number;
  totalSteps?: number;
  recentDetections?: string[];
}

export interface StreamOptions {
  message: string;
  context: AssistantContext;
  history: ChatMessage[];
  signal?: AbortSignal;
  /** Called with each new token as it arrives. */
  onToken: (delta: string) => void;
}

export class MissingEndpointError extends Error {
  constructor() {
    super('Assistant endpoint is not configured (set VITE_ASSISTANT_ENDPOINT).');
    this.name = 'MissingEndpointError';
  }
}

function getEndpoint(): string {
  const url = import.meta.env.VITE_ASSISTANT_ENDPOINT;
  if (!url) throw new MissingEndpointError();
  return url;
}

/**
 * Stream a completion. Resolves with the full concatenated text once the
 * stream is done. Rejects on transport errors (AbortError included).
 */
export async function streamAssistant(opts: StreamOptions): Promise<string> {
  const endpoint = getEndpoint();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: opts.message,
      context: opts.context,
      history: opts.history,
    }),
    signal: opts.signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Assistant request failed: ${response.status} ${detail.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Anthropic SSE frames are separated by a blank line.
    let splitIdx: number;
    while ((splitIdx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, splitIdx);
      buffer = buffer.slice(splitIdx + 2);
      const token = extractDeltaText(frame);
      if (token) {
        full += token;
        opts.onToken(token);
      }
    }
  }
  return full;
}

/**
 * Each SSE frame looks like:
 *   event: content_block_delta
 *   data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}
 * We only care about text deltas — everything else (message_start, usage,
 * message_stop) is ignored.
 */
function extractDeltaText(frame: string): string | null {
  const dataLine = frame
    .split('\n')
    .find((line) => line.startsWith('data:'));
  if (!dataLine) return null;
  const payload = dataLine.slice(5).trim();
  if (!payload || payload === '[DONE]') return null;
  try {
    const parsed = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
      return parsed.delta.text ?? null;
    }
    return null;
  } catch {
    return null;
  }
}
