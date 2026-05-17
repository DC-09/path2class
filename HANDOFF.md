# Path2Class — Project Handoff

## Project Overview

Path2Class is a **QR-activated indoor wayfinding web app** for university campuses. Users scan a physical QR code on a wall, the app knows their location, they pick a destination, and the app guides them via:
- **AR overlay** (live camera feed + cyan arrow + bbox highlights from YOLO detections)
- **Text navigation** (linear step list + mini floor plan)
- **AI assistant** (streaming Claude responses, context-aware)

The project is a **multi-course master's project** — Emerging Technologies (AR), Deep Learning (YOLO), Generative AI (LLM assistant). The current MVP scope is **a single corridor**: 2nd floor, west wing, destination Room 124.

GitHub: `https://github.com/DC-09/path2class.git`

### Tech Stack

**Web app (active frontend)** — `web/`
- Vite 8 + React 19 + TypeScript 6 (strict)
- Tailwind CSS v3 (Liquid Glass design tokens)
- React Router 7 (one route per screen)
- Zustand (session + assistant stores)
- react-i18next (IT primary, EN, PT)
- lucide-react (available; custom inline SVG used for prototype-exact match)
- @tensorflow/tfjs (installed — CPU backend, used for real YOLO inference)

**LLM service** — `supabase/functions/chat-assistant/`
- Deno Supabase Edge Function
- Proxies streaming SSE from Groq's OpenAI-compatible Chat Completions API (`llama-3.3-70b-versatile`, max 400 tokens)

**Backend (legacy / unused by current web app)** — `backend/`
- FastAPI + Python 3.11+
- Ultralytics YOLO + OpenCV
- Anthropic / OpenAI SDK
- NetworkX (campus graph routing)

**Old frontend (deprecated)** — `frontend/`
- Vanilla HTML/JS/CSS PWA with manifest + service worker
- Was the original frontend before the Vite/React rewrite (commit `f1162c0`)

**iOS PoC (orphan)** — `ios/Path2Class/`
- SwiftUI mockup (untracked in git, see `?? ios/`)

### Architecture

```
┌──────────────────────────────────┐
│   web/ (Vite/React PWA-style)    │  ← Current frontend
│  ─ pages/ (7 routes)              │
│  ─ services/                      │
│     ─ detectionService.ts (REAL)  │  ← YOLOv8n TFJS, CPU backend, NMS
│     ─ assistantService.ts (SSE)   │  ─┐
│     ─ storageService.ts           │   │
│  ─ stores/ (Zustand)              │   │
│  ─ i18n/ (it/en/pt)               │   │
└──────────────────────────────────┘   │
                                        ▼
                  ┌──────────────────────────────────┐
                  │  supabase/functions/             │
                  │  chat-assistant (Deno)            │
                  │  → Anthropic Messages API (SSE)   │
                  └──────────────────────────────────┘

┌──────────────────────────────────┐
│   backend/ (FastAPI)              │  ← NOT WIRED TO web/
│  ─ /api/session/start             │     (was used by frontend/, deprecated)
│  ─ /api/navigation/{route,update} │
│  ─ /api/detect (YOLO server-side) │
│  ─ /api/assistant                 │
└──────────────────────────────────┘
```

The web app **does not call the FastAPI backend**. It calls the Supabase edge function directly for the assistant, and uses a mocked `detectionService` locally for AR. The backend is a parallel, more complete implementation that's been left intact (it has a multi-building campus graph, real YOLO inference, etc.) but isn't part of the current user flow.

---

## Directory Structure

```
Progetto/
├── .env, .env.example         # Backend env (ANTHROPIC_API_KEY etc.)
├── .gitignore
├── docker-compose.yml          # Backend container config (unused in current flow)
├── PROTOTYPE_GLASS.jsx         # Source-of-truth React prototype (Liquid Glass)
├── PROTOTYPE_REFERENCE.html    # Single-file static prototype (visual reference)
├── PROTOTYPE_SHELL.html        # Shell HTML for prototype embedding
├── Path2Class_Planning_e_Progettazione.md   # Original planning doc (Italian, ~65KB)
│
├── web/                        # ACTIVE FRONTEND (Vite + React + TS)
│   ├── README.md               # Detailed dev/deploy docs
│   ├── package.json            # No "test" script; lint + build only
│   ├── vite.config.ts          # plugins:[react()], server.allowedHosts: true
│   ├── tailwind.config.js      # Custom palette + radii (rounded-4xl: 32px)
│   ├── index.html              # Root HTML, no PWA manifest (plain web app by design)
│   ├── public/
│   │   ├── logo.svg            # Used as favicon too
│   │   └── models/
│   │       └── yolov8n_web_model/  # TFJS graph model (320px, 9 classes)
│   │           ├── model.json      # Model topology
│   │           ├── group1-shard1of3.bin
│   │           ├── group1-shard2of3.bin
│   │           └── group1-shard3of3.bin
│   └── src/
│       ├── main.tsx            # ReactDOM bootstrap + i18n init
│       ├── App.tsx             # Routes + i18n sync + AssistantSheet mount
│       ├── index.css           # Liquid Glass globals + animations + a11y
│       ├── pages/
│       │   ├── Splash.tsx              # /  — QR simulate landing
│       │   ├── Landing.tsx             # /landing — location, search, recents
│       │   ├── Destination.tsx         # /destination — door art + ETA + CTAs
│       │   ├── CameraPermission.tsx    # /permission — pre-flight explainer
│       │   ├── ArNav.tsx               # /navigate/ar — live camera + AR overlay
│       │   ├── TextNav.tsx             # /navigate/text — step list + floor plan
│       │   ├── Arrived.tsx             # /arrived — confetti + match card
│       │   └── DebugGlass.tsx          # /debug/glass — design QA route
│       ├── components/
│       │   ├── glass/                  # GlassCard, GlassButton, GlassChip,
│       │   │                           # GlassIconButton, Icon (26 inline SVGs)
│       │   ├── art/                    # QRArt, DoorArt (decorative SVG)
│       │   ├── ar/                     # CameraView (getUserMedia ref-forward),
│       │   │                           # AROverlay (arrow + bbox highlights),
│       │   │                           # InstructionBanner, DeviationAlert
│       │   ├── text/                   # StepList, MiniFloorPlan
│       │   └── assistant/              # AssistantFab (FAB),
│       │                               # AssistantSheet (modal sheet),
│       │                               # ChatMessage, TypingIndicator,
│       │                               # SuggestionChips, ChatComposer
│       ├── services/
│       │   ├── detectionService.ts     # REAL YOLOv8n via TF.js CPU backend
│       │   │                           # NMS post-processing, ~3 FPS throttle
│       │   ├── assistantService.ts     # SSE client (fetch + ReadableStream),
│       │   │                           # MissingEndpointError class
│       │   ├── assistantContext.ts     # Builds AssistantContext payload
│       │   └── storageService.ts       # localStorage wrapper (p2c.* keys)
│       ├── stores/
│       │   ├── useSessionStore.ts      # language, accessibility, currentStep,
│       │   │                           # arrowDirection, locationKey
│       │   └── useAssistantStore.ts    # open, messages, isTyping, streaming
│       ├── i18n/
│       │   ├── index.ts                # init + language detection
│       │   └── locales/{it,en,pt}.json # 117 keys each
│       └── data/
│           └── corridor.json           # MVP corridor IDs (locationKey,
│                                       # destination.nodeId, ETA, distance)
│
├── supabase/
│   └── functions/
│       └── chat-assistant/
│           └── index.ts                # Deno edge function — streams Groq SSE
│                                       # (OpenAI-compatible);
│                                       # MODEL='llama-3.3-70b-versatile';
│                                       # CORS locked to localhost:5173 + *.vercel.app
│
├── backend/                    # NOT WIRED TO web/ — legacy/parallel
│   ├── Dockerfile
│   ├── requirements.txt        # fastapi 0.115, anthropic 0.42, openai 1.58,
│   │                           # ultralytics 8.3, opencv, networkx
│   └── app/
│       ├── main.py             # FastAPI bootstrap, CORS *, mounts /static
│       │                       # serving frontend/ for old PWA flow
│       ├── config.py           # Pydantic settings, .env loading,
│       │                       # default model: claude-sonnet-4-6-20250415
│       │                       # ⚠ MODEL ID INCLUDES INCORRECT DATE SUFFIX
│       ├── routers/
│       │   ├── session.py      # POST /api/session/start
│       │   ├── navigation.py   # /api/navigation/{destinations,route,update,text_route}
│       │   ├── detect.py       # POST /api/detect (multipart image)
│       │   └── assistant.py    # POST /api/assistant/chat
│       ├── services/
│       │   ├── yolo_service.py # Ultralytics wrapper, falls back to mock
│       │   ├── llm_service.py  # Anthropic + OpenAI + rule-based fallback;
│       │   │                   # SYSTEM_PROMPT in Italian
│       │   ├── campus_graph.py # NetworkX-based routing
│       │   ├── position.py     # Detection-driven position update
│       │   └── session_manager.py # In-memory session store
│       ├── models/             # Pydantic request/response schemas
│       └── data/
│           └── campus_graph.json # FULL multi-building campus
│                                 # (vs. corridor.json's MVP single corridor)
│
├── frontend/                   # DEPRECATED — old vanilla JS PWA
│   ├── index.html              # Multi-screen single-page HTML
│   ├── manifest.json
│   ├── sw.js
│   ├── css/style.css
│   ├── js/app.js
│   ├── assets/
│   └── models/                 # Was for ONNX YOLO (gitignored shards)
│
├── yolo/                       # YOLO training pipeline
│   ├── config/
│   │   └── campus_dataset.yaml # 9 classes; matches DetectionClass in web/
│   ├── datasets/
│   │   └── campus/
│   │       ├── images/{train,val,test}/   # ALL EMPTY — no data collected yet
│   │       └── labels/{train,val,test}/   # ALL EMPTY
│   ├── models/                 # Empty — no trained checkpoint
│   └── scripts/
│       ├── create_sample_data.py  # Synthetic data generator
│       ├── train.py
│       ├── evaluate.py
│       └── export_model.py        # Targets ONNX (would need TFJS adapt)
│
└── ios/                        # UNTRACKED — SwiftUI proof-of-concept
    └── Path2Class/
        ├── Path2ClassApp.swift
        └── ContentView.swift
```

---

## Implementation Status

### ✅ Done

**UI / UX (web/)**
- All 7 screens implemented, visually 1:1 with `PROTOTYPE_REFERENCE.html`
- Liquid Glass design system: `.glass`, `.glass-strong`, `.glass-dim`, glow utilities, animations (`pulse-cyan`, `pulse-amber`, `float-y`, `slide-up`, `fade-in`, `fall`, `draw-ring`)
- Custom 26-icon inline SVG set (`components/glass/Icon.tsx`) — required for prototype parity (lucide alternates exist but aren't used in screens)
- Routing via React Router 7
- i18n in IT/EN/PT with auto-detection from `navigator.language`
- Camera lifecycle (`getUserMedia` → camera tear-down on unmount → fallback to text on error)
- Recent destinations persisted to `localStorage` under `p2c.*` keys
- Accessibility: ARIA, focus rings, ESC closes sheet, `prefers-reduced-motion` disables decorative animation, semantic `<button>` for clickable cards
- Mobile viewport handling: `100dvh` units throughout, `env(safe-area-inset-bottom)` on FAB, body bg matches gradient (no black bands on iOS Safari)

**LLM Assistant (web/ + supabase/)**
- Frontend SSE client parsing OpenAI-format `choices[0].delta.content` events (Groq)
- Streaming UI with `▋` cursor while tokens arrive
- Context payload built from session state (location, destination, mode, accessibility, language, current step, recent detections)
- Suggestion chips per active route
- Edge function with strict CORS (localhost:5173 + *.vercel.app), system-prompt construction, full corridor map embedded in prompt

**Guided Navigation Flow (web/)**
- Deterministic 5-step Q&A state machine inside the assistant sheet —
  no LLM call, no backend, runs entirely client-side
- Activated via the "Guidami all'Aula 124" chip at the top of the
  suggestion row (or matching label in EN/PT)
- Each step renders the assistant's question describing the expected
  surroundings (elevator+bin, door, signal, vent, classroom door)
- User replies with Yes / No quick-reply buttons or free text;
  `interpretYesNo()` keyword matcher handles natural-language replies
- On Yes → next step. On No → repeats the same step with a localised
  help message. At the terminal step the bot says "arrivato" and exits
  guided mode, leaving the free-form chat available again
- Data: `web/src/data/guidedNavigation.ts` (step config + interpreter)
- Strings: `assistant.guided.*` in all three i18n locales

**Detection (real)**
- `detectionService` with stable public API: `subscribe(listener)`, `start()`, `stop()`, `DetectionFrame`, `Detection`, `BBox` (normalized 0..1)
- YOLOv8n model trained on campus images (Roboflow dataset `niccols-workspace-y3vkd/path2class`, version 3, imgsz=320)
- **7 classes** (from `metadata.yaml`): `path2class` (0), `bin` (1), `door` (2), `elevator` (3), `painting` (4), `signal` (5), `vent` (6)
- Exported as TFJS Graph Model, served from `web/public/models/yolov8n_web_model/`
- TF.js CPU backend (avoids WebGL context conflict with camera), ~3 FPS throttle
- Full NMS post-processing and YOLOv8 output decoding implemented in TypeScript

### 🟡 Partial

**Supabase deployment**
- Function code is committed and complete
- `GROQ_API_KEY` secret has not been set in the user's Supabase project
- `VITE_ASSISTANT_ENDPOINT` not configured in `.env.local` → assistant returns `MissingEndpointError`
- The `.env.example` template is provided

**Backend (FastAPI)**
- All routers, services, models implemented
- Campus graph for the full multi-building campus exists at `backend/app/data/campus_graph.json`
- YOLO service has fallback-to-mock logic if no `.pt` model file exists
- LLM service supports Anthropic + OpenAI + rule-based fallback (Italian-language fallback responses)
- ⚠ **Not connected to current web frontend at all** — would need a refactor of services/* to call `/api/*` instead of Supabase + mock detection
- ⚠ **Bug:** `config.py` line 10 uses `claude-sonnet-4-6-20250415` as default model — that suffix is invented (real ID is `claude-sonnet-4-6` with no date)

**YOLO training**
- Dataset folders exist but are completely empty (images/labels for train/val/test)
- Training scripts present (`train.py`, `evaluate.py`, `export_model.py`)
- `create_sample_data.py` for synthetic generation
- Class taxonomy (9 classes) consistent across `yolo/config/campus_dataset.yaml`, `backend/app/services/yolo_service.py:CLASS_NAMES`, and `web/src/services/detectionService.ts:DetectionClass`

### ❌ Missing

- **Real-world QR codes** — no generated/printed assets, no encoding utility for `?loc=<key>` URLs
- **Production deploy** — code is on GitHub (commit `052c612`) but Vercel auto-deploy didn't trigger; needs `npx vercel --prod` from `web/` or webhook fix by dc-09
- **Tests** — zero unit/integration tests in any module
- **Service worker / installable PWA** — explicitly removed by the user; "plain web app" was a hard requirement

---

## Known Bugs / Incomplete Logic

1. **`backend/app/config.py:10`** — `llm_model: str = "claude-sonnet-4-6-20250415"`. The date suffix is incorrect. Use `claude-sonnet-4-6`.
2. **Recents labels frozen at arrival time** (documented in `web/README.md`): if user changes language after arriving, previously-saved destinations still display in the language they were saved in. Fix: store only `nodeId` in `p2c.recent` and look up localized strings on render via i18n.
3. **`useSessionStore.locationKey` not actually used downstream** — set on QR-deeplink validation in `Landing.tsx` but no other screen reads it. The corridor JSON is read directly. Either remove the store field or wire it into routing decisions.
4. **iOS DeviceOrientationEvent not requested** — `arrowDirection` in the session store is set imperatively (e.g. by deviation timer). Real heading-based AR will need explicit permission request on `/permission`.
5. **`backend/app/main.py:36`** — `allow_origins=["*"]` overrides the `settings.cors_origins` parsed value. Either remove the wildcard or remove the parsed `origins` variable; current code is dead.
6. **Untracked `ios/` folder** — appears in `git status` as `?? ios/`. SwiftUI mockup not committed; user should decide whether to commit, gitignore, or delete.
7. **Old `frontend/` has uncommitted modifications** — `git status` shows `M frontend/{index.html, css/style.css, js/app.js}` and `M backend/app/main.py`. These predate the Vite rewrite. Either revert/discard or migrate any salvageable changes before deleting.
8. **`vite.config.ts:server.allowedHosts: true`** is set permissively for ngrok testing. Acceptable for dev but worth noting in deployment docs.
9. **Vercel auto-deploy not firing** — the GitHub webhook didn't trigger a new deployment on push `052c612`. dc-09 should check Vercel project → Settings → Git → verify the branch and webhook configuration.

---

## Next Steps (Prioritized)

### 1. Activate the LLM Assistant
Get a Groq API key at https://console.groq.com (free tier), then:
```sh
npm install -g supabase
supabase login
supabase link --project-ref <REF>
supabase secrets set GROQ_API_KEY=gsk_...
supabase functions deploy chat-assistant
# Then in web/.env.local:
VITE_ASSISTANT_ENDPOINT=https://<REF>.functions.supabase.co/chat-assistant
```
Test by opening the assistant FAB on Landing — should stream a localized welcome continuation.

### 2. Decide Backend Strategy
Three options, in increasing effort:
- **(a) Delete `backend/`** — current web app doesn't need it; the demo can ship with edge function + mock YOLO + (eventually) real client-side YOLO. Simplest.
- **(b) Keep `backend/` for the DL team** — server-side YOLO inference is faster and cheaper than client-side TFJS. Web app would call `POST /api/detect` with frame blobs from the camera. Requires fixing the model-ID bug, removing wildcard CORS, deploying somewhere (Render/Fly/Railway), and rewriting `web/src/services/detectionService.ts` to fetch instead of mock. Most flexible.
- **(c) Hybrid** — backend serves only `/api/detect`; assistant stays on Supabase. Keeps each component on its best platform.
Pick one before doing #3 below.

### 3. Test YOLO in the Real Corridor
The model is trained (Roboflow dataset, version 3) and integrated. Test on-site at the 2nd floor, west wing. If accuracy is insufficient, collect more images and re-train with `python yolo/scripts/train.py`, then re-export with `model.export(format='tfjs', imgsz=320)` and replace the files under `web/public/models/yolov8n_web_model/`.

### 4. Deploy to Vercel
Run `npx vercel --prod` from `web/`. Alternatively, have dc-09 check the Vercel project's Git integration settings — the auto-deploy webhook didn't fire on the `052c612` push.

### 5. Generate Physical QR Codes
Each QR encodes `https://<deploy-url>/landing?loc=<locationKey>`. For the MVP, only `entrance_b_corridor_2w` is recognized; `Landing.tsx:30` checks against `corridor.locationKey` and shows an error card for unknown values. Extend `corridor.json` (or move to a multi-location data file) when adding more.

### 6. Expand Beyond the MVP Corridor
Currently the UI hardcodes a single destination (Room 124). To extend:
- Either migrate `web/src/data/corridor.json` to a multi-node graph similar to `backend/app/data/campus_graph.json`
- Or wire the FastAPI backend's `/api/navigation/destinations` and `/api/navigation/route` endpoints

### 7. User Testing
On real campus hardware. Verify HTTPS works, camera permission flow on iOS Safari (which has its own quirks with `getUserMedia`), and SSE doesn't break behind university Wi-Fi.

### 8. User Testing
On real campus hardware. Verify HTTPS works, camera permission flow on iOS Safari (which has its own quirks with `getUserMedia`), and SSE doesn't break behind university Wi-Fi.

---

## Conventions and Patterns

### Naming
- **Components**: PascalCase, one component per file, default export. Glass primitives in `components/glass/` re-export through `index.ts`.
- **Services**: lowercase camelCase, singleton pattern (`detectionService`, `storageService`).
- **Stores**: `use<Name>Store.ts`, Zustand vanilla (no middleware except hand-rolled persistence in stores that need it).
- **Routes**: kebab-case where multi-word (`/navigate/ar`, `/debug/glass`).
- **i18n keys**: dotted paths (`landing.invalid_loc_title`, `arrived.actions.save`); arrays for ordered lists (`text_nav.steps_standard`).
- **localStorage keys**: namespaced `p2c.<key>` (e.g. `p2c.lang`, `p2c.a11y`, `p2c.recent`).

### State Management
- **Zustand stores** are the source of truth for cross-screen state. Persistence is handled inside store init via `storageService`.
- **i18next** is hydrated once in `main.tsx`, kept in sync with the session store via a `useEffect` in `App.tsx:23` (don't add a duplicate sync elsewhere).
- **Local component state** for ephemeral UI (open/closed, focus rings, in-flight fetch).

### Layout / Mobile
- Pages use `min-h-[100dvh]` (or `h-[100dvh]` for camera/internal-scroll layouts) — never `min-h-screen` alone, because iOS Safari's URL bar collapse breaks `100vh`.
- App root in `App.tsx` is just `<div className="relative w-full">` — pages own their own height.
- FAB and assistant sheet use `position: fixed` with `env(safe-area-inset-bottom)` insets.
- `body` background is the warm sand gradient (matches `.warm-bg`) so any pull-to-refresh / overscroll never reveals dark color.

### Error / Edge Handling
- `MissingEndpointError` — assistant service throws this when `VITE_ASSISTANT_ENDPOINT` is unset; the sheet catches and displays a localized message
- Camera errors in `ArNav` redirect via `navigate('/navigate/text', { replace: true })`
- Unknown `?loc=` in `Landing` renders an error card instead of falling through to the normal landing
- `storageService` wraps every localStorage call in try/catch (private mode, quota errors → silent no-op)

### Build / Lint
- ESLint flat config at `web/eslint.config.js`. `react-hooks/purity` and `react-hooks/set-state-in-effect` are strict — there are intentional `eslint-disable-next-line` comments in `Arrived.tsx` for the confetti generator (one-shot mount-time randomness)
- TypeScript strict mode; no `any` outside the Deno edge function
- No tests, no `test` script in `package.json`

### Design Tokens (Tailwind)
- `navy: #1E3A5F`, `cyan: #7BC4D9`, `cyan-glow: #A8E3F5`, `amber: #F5B946`, `coral: #E86A5C`, `sand: #E8DFC9`
- `rounded-4xl: 32px` (custom)
- All decorative animations registered in `tailwind.config.js` keyframes section

---

## Local Setup

```sh
# Clone and install
git clone https://github.com/DC-09/path2class.git
cd path2class/web
npm install

# Dev server (no HTTPS — fine for desktop, no camera)
npm run dev          # http://localhost:5173

# Mobile testing (camera requires HTTPS)
npm run dev
# In a second terminal:
ngrok http 5173      # Use the https://...ngrok-free.app URL on phone

# Build / preview
npm run build        # tsc -b && vite build
npm run preview      # Serve dist/ for production-like testing

# Lint
npm run lint
```

For the assistant to function, copy `web/.env.example` → `web/.env.local` and set `VITE_ASSISTANT_ENDPOINT` to a deployed Supabase function URL. Deploy with:
```sh
supabase login
supabase link --project-ref <REF>
supabase secrets set GROQ_API_KEY=gsk_...
supabase functions deploy chat-assistant
```

For the (unused but functional) FastAPI backend:
```sh
cd backend
python -m venv venv && source venv/bin/activate    # or venv/Scripts/activate on Windows
pip install -r requirements.txt
cd app
uvicorn main:app --reload --port 8000
```
Will run in mock mode for both YOLO and LLM unless `.env` provides keys + a `.pt` checkpoint at `yolo/models/best_campus.pt`.

---

## Recent Git History

```
052c612  Integrate real YOLOv8 TFJS model replacing mock detection service
345e042  Rebuild UI, activate Groq assistant, deploy to Vercel, clean up legacy code
f1162c0  Rebuild frontend as Vite + React + TypeScript web app
090112b  Initial commit: Path2Class AR campus navigation system
```

The YOLO integration (commit `052c612`) replaced the mock `detectionService` with real TF.js inference. The model was trained on Roboflow (project `niccols-workspace-y3vkd/path2class`, version 3) and exported as a TFJS Graph Model at 320px.
