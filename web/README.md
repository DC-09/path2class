# Path2Class — Web (PWA)

QR-activated indoor wayfinding PWA with AR navigation. University MVP covering
a single corridor (Building B, 2nd floor, West wing, destination Room 124).

Built from the **Liquid Glass** prototype produced in Claude Design. The visual
output matches the prototype 1:1 — the phone frame that appears in the
prototype is **presentation only**; the real app is full-screen.

## Stack

- **Vite + React 19 + TypeScript** (strict)
- **Tailwind CSS v3** — Liquid Glass tokens in [tailwind.config.js](tailwind.config.js)
- **React Router 7** — route per screen
- **Zustand** — session store + assistant store
- **react-i18next** — IT / EN / PT (IT primary)
- **Lucide React** — available; custom inline SVG used where 1:1 match matters
- **@tensorflow/tfjs** — installed, CPU backend, real YOLOv8n inference active
- **Guided navigation chatbot** — deterministic 5-step Q&A flow inside the assistant sheet, runs client-side without the LLM (works even when Groq isn't configured)
- **Supabase Edge Functions** — `chat-assistant` streams Groq (Llama 3.3 70B) responses

This is a plain web app, not a PWA — no manifest, no service worker, no "add to home screen". Open it in a mobile browser and use it like any other website.

## Project layout

```
web/
├── public/                 # logo.svg (also used as favicon)
├── src/
│   ├── App.tsx             # router + i18n sync + chat-sheet mount
│   ├── main.tsx            # Vite bootstrap
│   ├── index.css           # Liquid Glass global tokens + animations
│   ├── pages/              # Splash, Landing, Destination, CameraPermission,
│   │                       # ArNav, TextNav, Arrived, DebugGlass
│   ├── components/
│   │   ├── glass/          # GlassCard, GlassButton, GlassChip, GlassIconButton, Icon
│   │   ├── art/            # QRArt, DoorArt
│   │   ├── ar/             # CameraView, AROverlay, InstructionBanner, DeviationAlert
│   │   ├── text/           # StepList, MiniFloorPlan
│   │   └── assistant/      # AssistantFab, AssistantSheet, ChatMessage,
│   │                       # TypingIndicator, SuggestionChips, ChatComposer
│   ├── services/
│   │   ├── detectionService.ts   # REAL YOLOv8n via TF.js, 7 classes, CPU backend
│   │   ├── assistantService.ts   # SSE client → Supabase edge fn
│   │   ├── assistantContext.ts   # Builds system-prompt payload
│   │   └── storageService.ts     # Typed localStorage wrapper (p2c.*)
│   ├── stores/             # useSessionStore, useAssistantStore
│   ├── i18n/               # init + locales/{it,en,pt}.json
│   └── data/corridor.json  # MVP corridor map + IDs
├── tailwind.config.js
├── vite.config.ts
└── .env.example            # VITE_ASSISTANT_ENDPOINT template
```

The Supabase edge function lives outside this package at
[../supabase/functions/chat-assistant/index.ts](../supabase/functions/chat-assistant/index.ts).

## Quick start

```sh
cd web
npm install
npm run dev              # http://localhost:5173
```

For the chat assistant to work you need a deployed Supabase edge function —
see [Supabase deployment](#supabase-deployment) below. Without it the UI still
runs; sending a chat message shows a localised "not configured" fallback.

### Other commands

```sh
npm run build                   # tsc -b + vite build
npm run preview                 # serve dist/ for phone testing
npm run lint                    # eslint src
```

### Testing on a phone

The camera requires HTTPS. Two paths:

1. **ngrok over the dev server** (fastest):
   ```sh
   npm run dev
   ngrok http 5173
   ```
   Open the `https://…ngrok.app` URL on the phone; grant camera permission.

2. **Build + preview over ngrok** (closer to production):
   ```sh
   npm run build && npm run preview -- --host
   ngrok http 4173
   ```

## Screens & flow

```
Splash → Landing → Destination → CameraPermission → ArNav → Arrived
                 ↘                                ↘       ↗
                   Recents (localStorage)         TextNav ↗
```

- **Splash** `/` — Simulate QR scan → Landing.
- **Landing** `/landing` — location card, language (IT/EN/PT cycle), accessibility toggle (amber glow), search → autocomplete, Recents (last 5), Nearby. Accepts `?loc=<key>` QR deeplinks; unknown codes render an error card. Entry point from the QR encoder.
- **Destination** `/destination` — hero door art, accessibility chip, ETA + distance, AR / text CTAs.
- **CameraPermission** `/permission` — pre-flight explainer.
- **AR Navigation** `/navigate/ar` — live camera feed + pulsing cyan arrow + bbox highlights from `detectionService` + instruction banner + Demo pill (Wrong turn / Arrive / A11y). Camera errors redirect to `/navigate/text`.
- **Text Navigation** `/navigate/text` — linear step list + mini floor plan (elevator highlighted amber when accessibility is on; stairs crossed out).
- **Arrived** `/arrived` — confetti + match-confirmation card. Pushes the destination to `p2c.recent`.
- **Debug** `/debug/glass` — renders every glass variant in isolation for design review. Not linked from the main flow.

The **AI Assistant** overlays every screen except Splash / Destination / Permission. Suggestion chips are scoped to the active route.

## State & persistence

`p2c.lang`, `p2c.a11y`, `p2c.recent` — namespaced keys through [storageService.ts](src/services/storageService.ts). Safe no-ops in private mode. Language auto-detects from `navigator.language` on first visit.

## Modello YOLO integrato

Il modello reale è già attivo. La detection service carica da `public/models/yolov8n_web_model/` al primo avvio della schermata AR.

**Classi riconosciute** (ordine dal `metadata.yaml`, devono corrispondere a `CLASS_NAMES` in `detectionService.ts`):

| Indice | Classe | Label |
|--------|--------|-------|
| 0 | `path2class` | QR Path2Class |
| 1 | `bin` | Cestino |
| 2 | `door` | Porta |
| 3 | `elevator` | Ascensore |
| 4 | `painting` | Quadro |
| 5 | `signal` | Segnale |
| 6 | `vent` | Bocchetta |

Per ri-allenare il modello: aggiorna il dataset su Roboflow, ri-esporta con `model.export(format='tfjs', imgsz=320)` in Colab, sostituisci i file in `public/models/yolov8n_web_model/` e aggiorna `CLASS_NAMES` e `DetectionClass` in `detectionService.ts` se le classi cambiano.

La API pubblica del servizio rimane stabile (`subscribe`, `start`, `stop`, `DetectionFrame`, `Detection`, `BBox` normalizzato 0..1).

## Supabase deployment

The assistant is **real, not mocked**. A Supabase Edge Function proxies streaming calls to Groq's OpenAI-compatible Chat Completions API and injects a strict, corridor-scoped system prompt.

### One-time setup

```sh
# From the repo root
npm install -g supabase
supabase init                   # creates supabase/ config if absent
supabase login
supabase link --project-ref <YOUR-PROJECT-REF>
supabase secrets set GROQ_API_KEY=gsk_…
```

Get a key at https://console.groq.com (free tier is plenty for development).

### Deploy

```sh
supabase functions deploy chat-assistant
```

This uploads [../supabase/functions/chat-assistant/index.ts](../supabase/functions/chat-assistant/index.ts). The function URL will be:

```
https://<PROJECT-REF>.functions.supabase.co/chat-assistant
```

### Wire up the frontend

```sh
cp .env.example .env.local
# Open .env.local and set VITE_ASSISTANT_ENDPOINT to the URL above.
```

### What the function does

- Accepts `POST { message, context, history }`.
- Builds the system prompt from the context (location, destination, mode, accessibility, language, current step, recent detections).
- Calls `llama-3.3-70b-versatile` on Groq with `max_tokens: 400`, `stream: true`.
- Proxies the upstream SSE body verbatim — the frontend parses OpenAI-format `choices[0].delta.content` frames and appends tokens to the visible chat bubble as they arrive.
- CORS is locked to `localhost:5173` and `*.vercel.app`. Update
  `ALLOWED_ORIGIN_SUFFIXES` / `ALLOWED_ORIGINS` in the function when deploying to another host.

### Changing the model

Edit the `MODEL` constant at the top of
[../supabase/functions/chat-assistant/index.ts](../supabase/functions/chat-assistant/index.ts).

## Accessibility

- Semantic HTML — navigation affordances (back, close, FAB, recents, nearby) are real `<button>`s; images/decorative SVG are `aria-hidden`.
- Every icon-only button has an `aria-label` — localised via i18n.
- `:focus-visible` outlines use the cyan accent; keyboard navigation works through every interactive element.
- `prefers-reduced-motion` disables all decorative animation (float, pulse, typing dots, confetti, fade-in transitions) — see [src/index.css](src/index.css).
- `role="alertdialog"` + `aria-live="assertive"` on the deviation overlay; `role="dialog"` + `aria-modal="true"` on the chat sheet. ESC closes the sheet.
- Tap targets: primary buttons ≥ 44×44 CSS px. Chips, which are secondary affordances, meet the WCAG 2.2 AA 24×24 minimum.

## Known issues

- **Recents labels are frozen at arrival time** — if the user changes language after arriving, previously-saved destinations still display in the old language. Acceptable for MVP; fix by storing only `nodeId` and looking up localised strings on render.
- **iOS requires a user gesture before `DeviceOrientationEvent`** — not currently used for AR compass heading (the arrow direction is driven by the session store). Add a permission request on `/permission` when the feature lands.
