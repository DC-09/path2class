# Path2Class — Project Handoff

## Project Overview

Path2Class is a **QR-activated indoor wayfinding web app** for university campuses. Users scan a physical QR code on a wall, the app knows their location, they pick a destination, and the app guides them via:
- **AR overlay** — live camera feed + Liquid-Glass cyan arrow (rotates ±35° for turns) + bbox highlights from real YOLO detections
- **Text navigation** — 4 simple steps + L-shaped mini floor plan
- **AI assistant** — Llama 3.3 70B on Groq, streamed via Supabase Edge Function, with a rich RAG system prompt (full route, capabilities, recovery, FAQ, project info)

The project is a **multi-course master's project** — Emerging Technologies (AR), Deep Learning (YOLO), Generative AI (LLM assistant). The current MVP scope is **a single corridor**: starting at the elevator on the 1st floor, destination Room 124. The map is L-shaped (horizontal stretch + perpendicular right branch).

- GitHub: `https://github.com/DC-09/path2class.git`
- Production: `https://path2class.vercel.app`
- QR (physical print-ready, encodes `?loc=elevator_corridor_1f`): `docs/qr-elevator.svg`

### Tech Stack

**Web app (active frontend)** — `web/`
- Vite 8 + React 19 + TypeScript 6 (strict)
- Tailwind CSS v3 (Liquid Glass design tokens)
- React Router 7 (one route per screen)
- Zustand (session + assistant stores)
- react-i18next (IT primary, EN, PT)
- lucide-react (available; custom inline SVG used for prototype-exact match)
- @tensorflow/tfjs (CPU backend, real YOLOv8n inference)

**LLM service** — `supabase/functions/chat-assistant/`
- Deno Supabase Edge Function
- Proxies streaming SSE from Groq's OpenAI-compatible Chat Completions API (`llama-3.3-70b-versatile`, max 400 tokens)
- Deployed with `--no-verify-jwt` (public access — no Supabase Auth needed)
- System prompt is a hand-rolled RAG (see `buildSystemPrompt`): full step-by-step route, step-aware recap table, wrong-turn recovery, assistant capabilities, technical FAQ, soft project blurb

**Hosting**
- Vercel for the web app (auto-deploys on `git push origin main`)
- Supabase for the edge function

**Backend (legacy / unused by current web app)** — `backend/`
- FastAPI + Python 3.11+
- Ultralytics YOLO + OpenCV
- Anthropic / OpenAI SDK
- NetworkX (campus graph routing)
- Left intact as a reference for when the map is extended beyond a single corridor

### Architecture

```
┌──────────────────────────────────────┐
│   web/ (Vite + React on Vercel)      │  ← Active frontend
│  ─ pages/ (8 routes)                  │
│  ─ services/                          │
│     ─ detectionService.ts (REAL YOLO) │
│     ─ assistantService.ts (SSE)       │ ─┐
│     ─ assistantContext.ts             │  │
│     ─ storageService.ts               │  │
│  ─ hooks/useStepAdvancer.ts           │  │  ← auto-advance + deviation
│  ─ stores/ (Zustand)                  │  │
│  ─ i18n/ (it/en/pt)                   │  │
│  ─ data/corridor.json (8-step machine)│  │
└──────────────────────────────────────┘  │
                                           ▼
                  ┌──────────────────────────────────┐
                  │  supabase/functions/             │
                  │  chat-assistant (Deno)           │
                  │  → Groq Chat Completions (SSE)   │
                  │    llama-3.3-70b-versatile       │
                  └──────────────────────────────────┘

┌──────────────────────────────────┐
│   backend/ (FastAPI)             │  ← NOT WIRED TO web/
│  ─ multi-building campus graph    │     (kept for future extension)
│  ─ server-side YOLO + LLM         │
└──────────────────────────────────┘
```

The web app **does not call the FastAPI backend**. It calls the Supabase edge function for the assistant and runs YOLO client-side via TensorFlow.js.

---

## Directory Structure

```
Progetto/
├── .gitignore
├── HANDOFF.md                  # This file
├── STATO_PROGETTO.md           # Italian, non-technical state-of-project doc
├── Path2Class_Planning_e_Progettazione.md   # Original planning doc (legacy)
├── PROTOTYPE_GLASS.jsx         # Source-of-truth React prototype (Liquid Glass, legacy)
├── PROTOTYPE_REFERENCE.html    # Single-file static prototype (visual reference)
├── PROTOTYPE_SHELL.html        # Shell HTML for prototype embedding
├── vercel.json                 # Vercel project config (buildCommand cd web && …)
├── .vercel/                    # Local Vercel project link (committed)
│
├── docs/
│   └── qr-elevator.svg         # Print-ready QR with Path2Class logo,
│                               # encodes path2class.vercel.app/?loc=elevator_corridor_1f
│
├── scripts/                    # Node one-off utilities
│   ├── generate-qr.mjs         # Builds docs/qr-elevator.svg
│   └── generate-favicon.mjs    # Builds web/public/favicon.svg
│
├── web/                        # ACTIVE FRONTEND (Vite + React + TS)
│   ├── README.md               # Detailed dev/deploy docs
│   ├── package.json            # No "test" script; lint + build only
│   ├── vite.config.ts          # plugins:[react()], server.allowedHosts: true
│   ├── tailwind.config.js      # Custom palette + radii (rounded-4xl: 32px)
│   ├── index.html              # Root HTML, no PWA manifest (plain web app by design)
│   ├── public/
│   │   ├── favicon.svg         # P2 mark on warm beige tile
│   │   ├── logo.png            # Tightly-cropped P2 mark used by QR generator
│   │   ├── logo-splash.png     # Padded P2 mark used by Splash screen
│   │   └── models/
│   │       └── yolov8n_web_model/  # TFJS graph model (320px, 7 classes)
│   │           ├── model.json
│   │           └── group1-shard{1,2,3}of3.bin
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css           # Liquid Glass globals + animations + a11y +
│       │                       # html bg color for iOS overscroll
│       ├── pages/
│       │   ├── Splash.tsx              # /  — design-handoff Splash (logo +
│       │   │                           # hero copy + 3 step cards + CTA),
│       │   │                           # forwards ?loc= to /landing
│       │   ├── Landing.tsx             # /landing
│       │   ├── Destination.tsx
│       │   ├── CameraPermission.tsx
│       │   ├── ArNav.tsx               # arrow + bbox + deviation alert
│       │   │                           # (no on-screen instruction banner)
│       │   ├── TextNav.tsx
│       │   ├── Arrived.tsx
│       │   └── DebugGlass.tsx
│       ├── components/
│       │   ├── glass/                  # GlassCard, GlassButton, GlassChip,
│       │   │                           # GlassIconButton, Icon
│       │   ├── art/                    # DoorArt (QRArt removed)
│       │   ├── ar/                     # CameraView, AROverlay (Liquid Glass
│       │   │                           # arrow), DeviationAlert
│       │   │                           # InstructionBanner removed
│       │   ├── text/                   # StepList, MiniFloorPlan (L-shape)
│       │   └── assistant/              # AssistantFab, AssistantSheet,
│       │                               # ChatMessage, TypingIndicator,
│       │                               # SuggestionChips, ChatComposer
│       ├── services/
│       │   ├── detectionService.ts     # REAL YOLOv8n via TF.js CPU backend
│       │   ├── assistantService.ts     # SSE client
│       │   ├── assistantContext.ts
│       │   └── storageService.ts
│       ├── hooks/
│       │   └── useStepAdvancer.ts      # advance on next-step trigger;
│       │                               # fire onDeviation on wrongTrigger or
│       │                               # wrongTimeoutMs
│       ├── stores/
│       │   ├── useSessionStore.ts      # language, accessibility, currentStep,
│       │   │                           # arrowDirection, locationKey
│       │   └── useAssistantStore.ts
│       ├── i18n/
│       │   ├── index.ts
│       │   └── locales/{it,en,pt}.json
│       └── data/
│           ├── corridor.json           # 8-step machine, wrongTrigger on step 0
│           │                           # (bin), wrongTimeoutMs on step 5
│           └── guidedNavigation.ts     # deterministic Yes/No guided flow
│
├── supabase/
│   └── functions/
│       └── chat-assistant/
│           └── index.ts                # Deno edge function (deployed,
│                                       # --no-verify-jwt). Hand-rolled RAG
│                                       # in buildSystemPrompt.
│
├── backend/                    # NOT WIRED TO web/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/                    # FastAPI multi-building implementation
│
└── yolo/                       # Training pipeline (Roboflow dataset v3)
    ├── config/campus_dataset.yaml
    ├── datasets/campus/        # empty in repo (committed shards in web/public/models/)
    └── scripts/                # train.py, evaluate.py, export_model.py
```

---

## Navigation Step Machine (`web/src/data/corridor.json`)

The route from elevator to Room 124 is encoded as 8 steps. The `useStepAdvancer` hook subscribes to the detection service and advances when the next step's `trigger` class is seen for `minFrames` consecutive frames above `minConfidence`. The current step's `arrow` is read by `AROverlay` to rotate the cyan arrow.

| # | Kind | Trigger | Arrow | What the user is doing |
|---|---|---|---|---|
| 0 | qr | — | right | At the QR (in front of the elevators); should turn right toward the painting |
| 1 | ar | `painting` | straight | Walking toward the door with the red fire-alarm sign |
| 2 | ar | `signal` | straight | At the fire-alarm sign, about to pass through the door |
| 3 | ar | `door` | straight | Just through the door, walking straight |
| 4 | ar | `signal` | straight | Passing the bathroom sign on the upper left — keep going straight |
| 5 | ar | `signal` | right | At the large sign on the left; turn right ~1 m past it |
| 6 | ar | `signal` | straight | Past the turn; sign on the right ahead |
| 7 | arrived | `door` | — | Two doors on the right; one is Room 124 |

### Deviation alerts
Two scenarios fire the existing `<DeviationAlert>`:
- **Step 0 — bin in view**: `wrongTrigger: ["bin"]`, `wrongMinFrames: 3`. If YOLO sees a bin at the elevator, the user is facing the wrong way.
- **Step 5 — no turn**: `wrongTimeoutMs: 10000`. If 10 s elapse without `signal` triggering step 6, the user probably walked straight into the wall instead of turning right.

The accessible toggle currently mirrors the standard route (we already start at the elevator — no stairs to avoid). The flag still flips visual emphasis in the UI but doesn't change the path.

---

## YOLO Model

Real client-side YOLOv8n via TensorFlow.js (CPU backend, ~3 FPS throttle, NMS post-processing). 7 classes (order matters — must match `CLASS_NAMES` and `DetectionClass`):

| Idx | Class | Used as |
|-----|-------|---------|
| 0 | `path2class` | QR mark itself (mostly unused at runtime) |
| 1 | `bin` | Wrong-direction trigger at step 0 |
| 2 | `door` | Trigger for steps 3 and 7 |
| 3 | `elevator` | (Currently not a step trigger) |
| 4 | `painting` | Trigger for step 1 |
| 5 | `signal` | Trigger for steps 2, 4, 5, 6 |
| 6 | `vent` | (Currently not a step trigger) |

Re-training: update the Roboflow dataset, re-export `model.export(format='tfjs', imgsz=320)` from Colab, replace files under `web/public/models/yolov8n_web_model/`, update `CLASS_NAMES`/`DetectionClass` only if the class taxonomy changes.

The detection service public API is stable: `subscribe(listener)`, `start()`, `stop()`, `DetectionFrame`, `Detection`, `BBox` (normalized 0..1).

---

## LLM Assistant — RAG sections in the system prompt

`supabase/functions/chat-assistant/index.ts:buildSystemPrompt` injects, in order:

1. **USER CONTEXT** — runtime values: location, destination, current instruction, mode, accessibility, language, current step, totalSteps, recent detections.
2. **KNOWN MAP** — setting + the 8 numbered route landmarks (painting, fire-alarm sign, bathroom sign, large sign, two final doors) + useful facts (~42 m, ~2-3 min, multilingual term mapping, accessible note).
3. **What the camera / AR system recognises** — class list + meaning of the "wrong direction" alert.
4. **STEP-AWARE RECAP** — table mapping ctx.currentStep → physical location, so "where am I?" returns a precise answer.
5. **RECOVERY FROM A WRONG TURN** — scripted recovery for the two known wrong-direction scenarios + a generic fallback ("describe ONE landmark you see").
6. **ASSISTANT CAPABILITIES** — what the bot can / cannot do; sourced when the user asks "what can you do?".
7. **TECHNICAL FAQ** — camera permission, lighting, white overscroll, hard refresh, language switch, "not configured" message.
8. **ABOUT PATH2CLASS** — non-technical user-facing blurb; tech details only if explicitly asked.
9. **JOB** — routing rules pointing each question type to the right section, plus tone, length, emergency redirection, small talk.
10. **STYLE** — calm campus guide, no emoji, no "Great question!" openings.

Each section is plain English in the source. The model responds in the user's current `ctx.language`.

---

## Implementation Status

### ✅ Done
- All 8 screens implemented; Splash uses the design-handoff redesign (logo float + 3 step cards + Get started CTA)
- Liquid Glass design system, custom 26-icon SVG set, full a11y wiring (ARIA, focus rings, ESC, prefers-reduced-motion)
- Mobile viewport handling: 100dvh, env(safe-area-inset-bottom) for FAB, html background tinted beige so iOS overscroll never goes white
- Liquid Glass cyan arrow in AR overlay (4 SVG layers: halo, frosted body, sheen, top edge)
- Real YOLOv8n inference client-side, NMS, ~3 FPS, 7 classes
- 8-step navigation machine + automatic advancement on YOLO triggers
- Two-channel deviation alert (YOLO-class wrong trigger + timer)
- 4-step text mode (it/en/pt)
- L-shaped MiniFloorPlan matching real corridor geometry (INIZIO label localised, dot advances along 8 nodes)
- AI assistant streaming from Groq via deployed Supabase edge function, public access (`--no-verify-jwt`), rich RAG system prompt
- Deterministic guided navigation Q&A flow as a fallback when the LLM is unavailable
- QR code generated (`docs/qr-elevator.svg`) with embedded Path2Class logo; favicon SVG generated on warm beige tile
- Production deploy on Vercel with auto-deploy on push to `main`; SPA rewrite rule in `vercel.json` so `/landing` etc. resolve client-side
- All "Building B" / "west wing" references removed across i18n, system prompt, docs

### 🟡 Partial / known limitations
- The 4 text-mode steps and the guided assistant dialogue are coherent with the route description but **need on-site verification** with the real corridor.
- The accessible route mirrors the standard route. Until there is a separate non-stair path to model, the toggle only changes visual emphasis.
- Bundle size ~1.4 MB / ~370 KB gzipped, dominated by TensorFlow. Could be reduced by lazy-loading YOLO only on `/navigate/ar`.

### ❌ Not done
- **Backend (FastAPI)** still not wired to the web app. Decision pending on whether to delete it, keep as reference, or use server-side YOLO (option B in the next-steps list below).
- **Multi-corridor map**. Currently a single `corridor.json` hard-codes one route.
- **Tests**. Zero unit/integration tests.
- **PWA**. Explicitly out of scope ("plain web app" requirement).

---

## Known Bugs

1. **Recents labels frozen at arrival time** (`web/README.md` documents this) — saved destination labels don't re-translate after a language switch. Fix: store `nodeId` only, look up at render time.
2. **`useSessionStore.locationKey`** is set on QR deeplink validation in `Landing.tsx` but isn't read by downstream screens (they read `corridor.locationKey` directly). Either wire it through or drop the field.
3. **iOS DeviceOrientationEvent** not requested. Arrow direction is set imperatively from the step machine, so heading-based AR is not active. Add permission request on `/permission` when needed.
4. **`backend/app/config.py`** still has `claude-sonnet-4-6-20250415` as default model (date suffix is invented). Real ID is `claude-sonnet-4-6`. Backend is unused so impact is zero, but worth fixing if/when reactivated.
5. **`backend/app/main.py`** uses `allow_origins=["*"]` overriding the parsed `settings.cors_origins`. Dead code — pick one.
6. **`vite.config.ts: server.allowedHosts: true`** permissively allows any host (needed for ngrok). Fine for dev, worth tightening if the dev server ever sees production.

---

## Next Steps (Prioritized)

### 1. Print and place the physical QR
`docs/qr-elevator.svg` is ready. Open it in a browser, Ctrl+P, A4, laminate, stick on the wall in front of the 1st-floor elevators. Confirm scanning on iOS Safari and Android Chrome takes you to the live app.

### 2. On-site YOLO test
The model is already deployed. Walk the corridor with the phone pointing forward. Verify each landmark advances the step at roughly the right physical point and that the bin/wall wrong-direction alerts behave as expected. If accuracy is insufficient, add field photos, re-train, re-export TFJS, drop the shards into `web/public/models/yolov8n_web_model/`, commit, push — Vercel auto-deploys.

### 3. Capture real landmark text
The text-mode steps and the guided assistant dialogue describe an imagined route. After walking the corridor once, refine the strings in:
- `web/src/i18n/locales/{it,en,pt}.json` → `text_nav.steps_standard`, `text_nav.steps_accessible`, `assistant.guided.steps.*`
- The system prompt in `supabase/functions/chat-assistant/index.ts` (then redeploy)

### 4. User testing
Have 3-5 people who don't know the corridor try the app end-to-end (QR scan → AR navigation → arrival). Note where they hesitate, what they ask the assistant, whether the deviation alerts fire correctly.

### 5. Decide backend strategy
Three options:
- **(a) Delete `backend/`** — current demo doesn't need it; simpler.
- **(b) Keep as reference** — useful when extending to multiple buildings (`campus_graph.json` has the full graph).
- **(c) Use as server-side YOLO** — would speed up detection and remove TFJS from the bundle, but requires re-wiring the detection service and hosting the FastAPI somewhere.

### 6. Extend beyond the MVP corridor
Currently `corridor.json` hardcodes one route. To extend, either grow it into a multi-node graph (similar to `backend/app/data/campus_graph.json`) or wire the FastAPI backend's `/api/navigation/*` endpoints.

---

## Conventions and Patterns

### Naming
- **Components**: PascalCase, one component per file, default export. Glass primitives re-export through `index.ts`.
- **Services**: lowercase camelCase, singleton pattern (`detectionService`, `storageService`).
- **Stores**: `use<Name>Store.ts`, Zustand.
- **Routes**: kebab-case (`/navigate/ar`, `/debug/glass`).
- **i18n keys**: dotted paths (`landing.invalid_loc_title`); arrays for ordered lists (`text_nav.steps_standard`).
- **localStorage keys**: namespaced `p2c.<key>`.

### State Management
- Zustand stores are the source of truth for cross-screen state. Persistence lives inside store init via `storageService`.
- i18next is hydrated once in `main.tsx`, kept in sync with the session store via a `useEffect` in `App.tsx`.
- Local component state for ephemeral UI.

### Layout / Mobile
- Pages use `min-h-[100dvh]` (or `h-[100dvh]` for camera/internal-scroll layouts).
- App root is `<div className="relative w-full">`; pages own their height.
- FAB and assistant sheet use `position: fixed` with `env(safe-area-inset-bottom)` insets.
- `html` background-color is `#ddd6c4` so iOS rubber-band overscroll never reveals white. Body gradient stays on top.

### Error / Edge Handling
- `MissingEndpointError` from `assistantService` when `VITE_ASSISTANT_ENDPOINT` is unset; sheet shows a localized "not configured" fallback.
- Camera errors in `ArNav` redirect to `/navigate/text` with `replace: true`.
- Unknown `?loc=` value in `Landing` renders an error card.
- `storageService` wraps every call in try/catch (private mode, quota → silent no-op).

### Build / Lint
- ESLint flat config at `web/eslint.config.js`. `react-hooks/purity` and `react-hooks/set-state-in-effect` strict; one-off `eslint-disable-next-line` in `Arrived.tsx` for confetti randomness.
- TypeScript strict; no `any` outside the Deno edge function.

### Design Tokens (Tailwind)
- `navy: #1E3A5F`, `cyan: #7BC4D9`, `cyan-glow: #A8E3F5`, `amber: #F5B946`, `coral: #E86A5C`, `sand: #E8DFC9`
- `rounded-4xl: 32px` (custom)
- All decorative animations in `tailwind.config.js` keyframes

---

## Local Setup

```sh
# Clone and install
git clone https://github.com/DC-09/path2class.git
cd path2class/web
npm install

# Dev server (no HTTPS — fine for desktop, no camera)
npm run dev          # http://localhost:5173

# Mobile testing with camera (HTTPS needed)
# Option A — use the live deploy: https://path2class.vercel.app
# Option B — ngrok over the dev server:
npm run dev
# in a second terminal:
ngrok http 5173

# Build / preview
npm run build
npm run preview

# Lint
npm run lint
```

### Deploying the edge function (one-off or after prompt changes)

```sh
# From the repo root
supabase login          # or set SUPABASE_ACCESS_TOKEN env var
supabase link --project-ref <REF>
supabase secrets set GROQ_API_KEY=gsk_...
supabase functions deploy chat-assistant --no-verify-jwt
```

The web app's `.env.local` (and Vercel env vars) must contain
`VITE_ASSISTANT_ENDPOINT=https://<REF>.functions.supabase.co/chat-assistant`.

### Regenerating the QR / favicon

```sh
node scripts/generate-qr.mjs        # → docs/qr-elevator.svg
node scripts/generate-favicon.mjs   # → web/public/favicon.svg
```

The QR script depends on `npm install --no-save qrcode` (used only locally; not committed to `package.json`).

---

## Recent Git History (top of `main`)

```
fe30744  MiniFloorPlan: fix INIZIO overlap, bigger node spacing, doors on opposite wall
e506645  Redesign MiniFloorPlan as L-shape matching the real corridor
76b5810  Redesign AR arrow in Liquid Glass style
f4ec3d3  Remove redundant filler text: keyword/wrong-turns lines, blue-door subtitle
1b928b6  Soften ABOUT section: no tech details unless explicitly asked
ef4f519  Expand assistant RAG: capabilities, step recap, recovery, FAQ, project info
26ceaab  Reroute navigation to elevator->Room 124 with proper landmarks; remove AR banner
8ae5c4f  Clean up dead code after Splash redesign
b481ba8  Add favicon.svg: cropped logo on warm beige background
c42ebb0  Redesign Splash screen to design-handoff spec; route QR to root
be9435f  Move MVP starting point to elevator on 1st floor; remove invented "west wing"
e93b1d6  Add QR code with logo, rename locationKey, remove "Building B" references
```

Use `git log --oneline` for the full history.
