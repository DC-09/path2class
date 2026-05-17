/**
 * Supabase Edge Function — chat-assistant
 *
 * Streams a response from Groq's OpenAI-compatible Chat Completions API
 * back to the browser. Deployed to Supabase; the only secret it needs is
 * GROQ_API_KEY.
 *
 *   supabase secrets set GROQ_API_KEY=gsk_…
 *   supabase functions deploy chat-assistant
 *
 * Request shape (POST JSON):
 *   { message: string, context: AssistantContext, history: ChatMessage[] }
 *
 * Response: text/event-stream proxying Groq's SSE stream verbatim.
 */

// deno-lint-ignore-file no-explicit-any
// @ts-ignore — Deno global is provided by the Supabase Edge runtime.
declare const Deno: { env: { get(k: string): string | undefined }; serve: (h: (r: Request) => Response | Promise<Response>) => void };

const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 400;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

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
This is the ONLY corridor the app currently covers. Do not invent anything outside it.

Setting
- The user is on the 1st floor of the campus.
- The QR checkpoint is positioned right in front of the elevators on the 1st floor.
- Destination: Room 124 (a classroom on the same floor, reachable on foot, ~42 m, ~2 min standard / ~3 min accessible).
- The route is the same for the standard and accessible modes — we already start at the elevators, so there are no stairs to avoid.

Step-by-step route from the QR (elevators) to Room 124
1. Just after scanning the QR, the user is standing in front of the elevators.
   - Look to the RIGHT to find a PAINTING on the wall. Walk in that direction.
   - AVOID the opposite direction: that side has a TRASH BIN — it's the wrong way.
   - Quick orientation heuristic: if 2 elevator doors are in front of you, go RIGHT; if 3 are in front, go LEFT. Either way, the painting marks the correct direction.
2. While walking toward the painting, the user will see a DOOR with a small RED FIRE-ALARM SIGN on its right side. That sign confirms the correct door.
3. Pass through that door.
4. Right after the door, a BATHROOM SIGN is visible high up on the LEFT wall. Keep going straight — do NOT turn at the bathroom sign.
5. Continue straight until a LARGE SIGN appears on the LEFT wall.
6. About 1 metre past the large sign, turn RIGHT. (If the user continues straight instead of turning, they will hit a wall — that is the wrong direction.)
7. After turning right, another SIGN is visible on the RIGHT wall. Continue straight.
8. About 2 metres further on the right, there are TWO DOORS side by side. One of them is Room 124 — destination reached.

Useful facts you can mention
- Total walk: roughly 42 metres, 2-3 minutes.
- All distance numbers are approximate — the user does not need to count metres.
- "Quadro" (Italian) / "Painting" (English) / "Quadro" (Portuguese) all refer to the same wall-mounted picture used as the first landmark.
- The red sign at landmark 2 is a fire-alarm / emergency sign (typical small red plaque), not generic decoration.
- The accessible mode currently mirrors the standard mode because we start at the elevators.

What the camera / AR system recognises on the user's screen
- The AR mode highlights detected objects with a translucent box and shows a pulsing arrow.
- Recognised classes (when YOLO sees them on screen): elevator, door, painting, signal, bin, vent.
- If the user reports seeing a "wrong direction" alert, it means either they turned toward the bin at the start, or they did not turn right past the large sign within ~10 seconds.

JOB
1. Answer in 2-3 sentences. Be helpful and friendly, not robotic.
2. Respond in ${ctx.language}; switch naturally if the user switches language.
3. When asked to simplify, rephrase the current instruction referencing the visible landmark for the user's current step.
4. If the user seems lost or anxious, reassure them briefly before giving directions.
5. If the user describes a mobility need and accessibility is OFF, suggest toggling it (even though the route is identical, the toggle changes the visual emphasis).
6. NEVER invent rooms, distances, or facilities beyond what is listed above.
7. If asked something outside navigation (e.g. the time, general questions), answer briefly and naturally if you can, then bring the focus back to helping them navigate. Only deflect if the question is truly unrelated to anything you can help with.
8. For medical, emotional or safety emergencies, redirect to human help.
9. You can make small talk — if the user greets you, greet back. If they thank you, acknowledge it warmly.

STYLE
Friendly campus guide, not a strict chatbot. Warm but concise. No emoji. No "Great question!" openings. Speak like a helpful person, not a system.`;
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

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    return jsonError(500, 'GROQ_API_KEY is not configured on the server', origin);
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

  const upstream = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: body.message },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return jsonError(
      upstream.status || 502,
      `Groq upstream error: ${detail.slice(0, 500)}`,
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
