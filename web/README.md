# Path2Class — Web

QR-activated indoor wayfinding web app with AR navigation. University MVP covering
a single corridor on the 1st floor: scan the QR in front of the elevators, the app
guides you to Room 124. Live at [path2class.vercel.app](https://path2class.vercel.app).

Built in the **Liquid Glass** visual language. The Splash screen follows a
dedicated design handoff (logo + hero copy + 3 step cards + "Get started" CTA);
everything else descends from `PROTOTYPE_REFERENCE.html` with the same translucent
surfaces, warm sand background, and cyan accents.

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
├── public/                 # favicon.svg, logo.png (QR center), logo-splash.png
├── src/
│   ├── App.tsx             # router + i18n sync + chat-sheet mount
│   ├── main.tsx            # Vite bootstrap
│   ├── index.css           # Liquid Glass global tokens + animations
│   ├── pages/              # Splash, Landing, Destination, CameraPermission,
│   │                       # ArNav, TextNav, Arrived, DebugGlass
│   ├── components/
│   │   ├── glass/          # GlassCard, GlassButton, GlassChip, GlassIconButton, Icon
│   │   ├── art/            # DoorArt
│   │   ├── ar/             # CameraView, AROverlay (Liquid Glass arrow), DeviationAlert
│   │   ├── text/           # StepList, MiniFloorPlan (L-shape)
│   │   └── assistant/      # AssistantFab, AssistantSheet, ChatMessage,
│   │                       # TypingIndicator, SuggestionChips, ChatComposer
│   ├── services/
│   │   ├── detectionService.ts   # REAL YOLOv8n via TF.js, 7 classes, CPU backend
│   │   ├── assistantService.ts   # SSE client → Supabase edge fn
│   │   ├── assistantContext.ts   # Builds system-prompt payload
│   │   └── storageService.ts     # Typed localStorage wrapper (p2c.*)
│   ├── hooks/useStepAdvancer.ts  # YOLO-driven step advancement + deviation
│   ├── stores/             # useSessionStore, useAssistantStore
│   ├── i18n/               # init + locales/{it,en,pt}.json
│   └── data/
│       ├── corridor.json   # 8-step machine, wrongTrigger on step 0, wrongTimeoutMs on step 5
│       └── guidedNavigation.ts  # deterministic Yes/No guided dialogue
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

- **Splash** `/` — welcome screen seen after scanning the QR. Logo (float-y animation), hero copy with brand inline (`path2class`), 3 step cards (Search · Follow · Arrive), "Get started" CTA. Forwards `?loc=` to `/landing`.
- **Landing** `/landing` — location card, language (IT/EN/PT cycle), accessibility toggle, search → autocomplete, Recents, Nearby. Accepts `?loc=<key>` QR deeplinks; unknown codes render an error card.
- **Destination** `/destination` — door art, accessibility chip, ETA + distance, AR / text CTAs.
- **CameraPermission** `/permission` — pre-flight explainer.
- **AR Navigation** `/navigate/ar` — live camera feed + Liquid Glass cyan arrow (rotates ±35° for turns) + bbox highlights from `detectionService` + Demo pill (Wrong turn / Next / Arrive / A11y). No on-screen instruction banner: only the arrow + bbox + deviation alert. Camera errors redirect to `/navigate/text`.
- **Text Navigation** `/navigate/text` — 4 simple steps + L-shaped mini floor plan (INIZIO marker, perpendicular branch ending at Room 124).
- **Arrived** `/arrived` — confetti + match-confirmation card. Pushes the destination to `p2c.recent`.
- **Debug** `/debug/glass` — renders every glass variant in isolation. Not linked from the main flow.

The **AI Assistant** overlays every screen except Splash / Destination / Permission. Suggestion chips are scoped to the active route.

## State & persistence

`p2c.lang`, `p2c.a11y`, `p2c.recent` — namespaced keys through [storageService.ts](src/services/storageService.ts). Safe no-ops in private mode. Language auto-detects from `navigator.language` on first visit.

## Navigation step machine

The route from elevator to Room 124 is an 8-step machine in [src/data/corridor.json](src/data/corridor.json). Each step has a YOLO `trigger` class — when seen for `minFrames` consecutive frames above `minConfidence`, `useStepAdvancer` advances to the next step. The current step's `arrow` field rotates the AR overlay (`right` / `left` = ±35°, `straight` = 0°).

Two deviation alerts are wired:
- **Step 0 `wrongTrigger: ["bin"]`** — at the elevator, seeing a bin means the user is facing the wrong way.
- **Step 5 `wrongTimeoutMs: 10000`** — at the large sign, if no `signal` advances the step within 10 s, the user probably went straight into the wall instead of turning right.

The text-mode equivalent is intentionally simplified to 4 high-level steps; landmarks live in `text_nav.steps_standard` (and `_accessible`) across the 3 locales.

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
supabase functions deploy chat-assistant --no-verify-jwt
```

`--no-verify-jwt` makes the function publicly callable without a Supabase Auth token, which is what we want for the unauthenticated web app.

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
