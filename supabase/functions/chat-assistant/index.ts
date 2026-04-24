/**
 * Supabase Edge Function — chat-assistant
 *
 * Streams a response from the Anthropic Messages API back to the browser.
 * Deployed to Supabase; the only secret it needs is ANTHROPIC_API_KEY.
 *
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-…
 *   supabase functions deploy chat-assistant
 *
 * Request shape (POST JSON):
 *   { message: string, context: AssistantContext, history: ChatMessage[] }
 *
 * Response: text/event-stream proxying Anthropic's SSE stream verbatim.
 */

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno global is provided by the Supabase Edge runtime.
declare const Deno: { env: { get(k: string): string | undefined }; serve: (h: (r: Request) => Response | Promise<Response>) => void };

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 400;

const ALLOWED_ORIGIN_SUFFIXES = ['.vercel.app'];
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    (origin && ALLOWED_ORIGINS.includes(origin)) ||
    (origin && ALLOWED_ORIGIN_SUFFIXES.some((s) => origin.endsWith(s)));
  return {
    'Access-Control-Allow-Origin': allowed ? (origin as string) : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

interface AssistantContext {
  location: string;
  destination: string;
  currentInstruction: string;
  mode: 'ar' | 'text' | 'landing' | 'arrived' | 'other';
  accessibility: boolean;
  language: 'it' | 'en' | 'pt';
  currentStep?: number;
  totalSteps?: number;
  recentDetections?: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  context: AssistantContext;
  history: ChatMessage[];
}

function buildSystemPrompt(ctx: AssistantContext): string {
  const recent = ctx.recentDetections?.length ? ctx.recentDetections.join(', ') : '(none)';
  return `You are the Path2Class navigation assistant for a university wayfinding PWA.
You help users find their way in a specific corridor.

USER CONTEXT
Location: ${ctx.location}
Destination: ${ctx.destination}
Current instruction: ${ctx.currentInstruction}
Mode: ${ctx.mode}
Accessibility: ${ctx.accessibility ? 'ON' : 'OFF'}
Language: ${ctx.language}
Step: ${ctx.currentStep ?? '—'} of ${ctx.totalSteps ?? '—'}
Recent detections: ${recent}

KNOWN MAP (complete — nothing else exists in this demo)
- Corridor: Building B, 2nd floor, west wing.
- Entrance (QR checkpoint) → Elevator on left → Stairs on right (avoid if accessibility ON) → Room 17 W left → Notice board → Room 21 W right → Emergency exit.

JOB
1. Answer in 1-2 sentences, max 3. Never verbose.
2. Respond in ${ctx.language}; switch if the user switches.
3. When asked to simplify, rephrase the current instruction referencing visible landmarks.
4. Be warm but brief when the user is rushed or anxious.
5. If the user describes a mobility need and accessibility is OFF, suggest toggling it.
6. NEVER invent rooms, distances, or facilities.
7. If asked about anything outside the corridor, say: "That's outside the current demo area. This prototype covers only the west corridor on floor 2 of Building B." (Translate into the user's language.)
8. For medical, emotional or safety emergencies, redirect to human help.

STYLE
Calm concierge, not chatbot. No emoji. No "Great question!" openings. Short native-quality sentences.`;
}

function jsonError(status: number, message: string, origin: string | null): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed', origin);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonError(500, 'ANTHROPIC_API_KEY is not configured on the server', origin);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return jsonError(400, 'Invalid JSON body', origin);
  }

  if (!body?.message || typeof body.message !== 'string') {
    return jsonError(400, 'Missing "message" string', origin);
  }

  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  const systemPrompt = buildSystemPrompt(body.context);

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: body.message },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Anthropic upstream error: ${detail.slice(0, 500)}`,
      origin,
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
});
