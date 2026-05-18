# Path2Class — Project Handoff

## Project Overview

Path2Class is a **QR-activated indoor wayfinding web app** for university campuses. Users scan a physical QR code on a wall, the app knows their location, they pick a destination, and the app guides them via:
- **AR overlay** — live camera feed + cyan PNG arrow (3 pre-oriented assets: straight, right, left). Detection bboxes are **not drawn** anymore — YOLO runs invisible under the hood.
- **Text navigation** — 4 simple steps + L-shaped mini floor plan with the dot advancing across 6 nodes
- **AI assistant** — Llama 3.3 70B on Groq, streamed via Supabase Edge Function, with a rich RAG system prompt (full route, capabilities, recovery, FAQ, project info). Sheet now ~97% opaque so background content no longer bleeds through. The "guided Yes/No" mode is gone — the start chip just sends a regular LLM message.

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
│  ─ hooks/useStepAdvancer.ts           │  │  ← composite triggers + dwell
│  ─ stores/ (Zustand)                  │  │
│  ─ i18n/ (it/en/pt)                   │  │
│  ─ data/corridor.json (6-step machine)│  │
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
│   │   ├── door-124.jpeg       # Real photo of the target classroom door
│   │   ├── arrows/             # AR navigation arrow PNGs (3 pre-oriented assets)
│   │   │   ├── arrow-straight.png
│   │   │   ├── arrow-right.png
│   │   │   └── arrow-left.png
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
│       │   ├── Landing.tsx             # /landing — Nearby list now lists
│       │   │                           # 'International & Employability Office'
│       │   │                           # instead of 'Notice board'
│       │   ├── Destination.tsx         # 1 min ETA, 32 m, hero photo of door
│       │   ├── CameraPermission.tsx
│       │   ├── ArNav.tsx               # camera + arrow + notice banner +
│       │   │                           # deviation alert. No demo pill,
│       │   │                           # no debug overlay, no bbox highlights
│       │   ├── TextNav.tsx
│       │   ├── Arrived.tsx
│       │   └── DebugGlass.tsx
│       ├── components/
│       │   ├── glass/                  # GlassCard, GlassButton, GlassChip,
│       │   │                           # GlassIconButton, Icon
│       │   ├── art/                    # DoorArt → renders /door-124.jpeg
│       │   ├── ar/                     # CameraView, AROverlay (PNG arrow,
│       │   │                           # 220×220 box, object-fit: contain),
│       │   │                           # DeviationAlert
│       │   ├── text/                   # StepList, MiniFloorPlan (L-shape, 6 nodes)
│       │   └── assistant/              # AssistantFab, AssistantSheet (opaque),
│       │                               # ChatMessage, TypingIndicator,
│       │                               # SuggestionChips, ChatComposer
│       ├── services/
│       │   ├── detectionService.ts     # REAL YOLOv8n via TF.js CPU backend
│       │   ├── assistantService.ts     # SSE client
│       │   ├── assistantContext.ts
│       │   └── storageService.ts
│       ├── hooks/
│       │   └── useStepAdvancer.ts      # composite trigger evaluation (count,
│       │                               # position, growing, closeTogether) +
│       │                               # minDwellMs throttling + wrongTrigger
│       │                               # and wrongTimeoutMs deviation
│       ├── stores/
│       │   ├── useSessionStore.ts      # language, accessibility, currentStep,
│       │   │                           # arrowDirection, locationKey
│       │   └── useAssistantStore.ts
│       ├── i18n/
│       │   ├── index.ts
│       │   └── locales/{it,en,pt}.json # ar.notice.destination_right added;
│       │                               # nearby.international_office replaces
│       │                               # nearby.notice_board
│       └── data/
│           ├── corridor.json           # 6-step machine, composite triggers,
│           │                           # minDwellMs on steps 1/3/4
│           └── guidedNavigation.ts     # legacy deterministic Yes/No flow
│                                       # (no longer invoked by the UI — kept
│                                       # for now in case it's wanted back)
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

The route from elevator to Room 124 is encoded as **6 steps**. Each step's `trigger` is an array of `TriggerCondition` objects that must **all** hold simultaneously (AND) for `minFrames` consecutive frames before the user advances to that step. Each condition supports:

| Field | What it does |
|---|---|
| `class` | YOLO class (`door`, `signal`, `elevator`, `bin`, `painting`, `vent`, `path2class`) |
| `minCount` | Number of detections of that class that must satisfy the rest (default 1) |
| `position` | Spatial constraint inside the frame: `left` / `right` / `center` / `top` / `middle` / `bottom` or one of the 4 corner combinations like `middle-right`. Uses bbox center; thresholds: x<0.4 = left, x>0.6 = right, y<0.4 = top, y>0.6 = bottom |
| `growing` | The largest matching bbox area must be trending up over a 6-frame rolling window (lastAvg > firstAvg × 1.2) |
| `closeTogether` | With `minCount ≥ 2`, the matching bboxes must be spatially clustered (centers within 0.35 of each other in normalised units) |

Plus a per-step `minDwellMs` (optional): the minimum ms the user must spend on a step before the next trigger is even evaluated. Prevents rapid-fire advancement when consecutive steps share landmarks.

Current corridor:

| # | Kind | Arrow | Trigger to advance | Dwell | What the user is doing |
|---|---|---|---|---|---|
| 0 | qr | straight | — (start, set by scanning QR) | — | At the QR. `wrongTrigger: ["bin"]` fires the deviation alert |
| 1 | ar | **right** | `signal ≥ 2` + `elevator ≥ 2` | 2.5 s | Just turned out of the elevator; arrow rotates to right |
| 2 | ar | straight | `door ≥ 2` | — | Walking down the main corridor toward the fire-alarm door |
| 3 | ar | **right** | `door @left` + `signal @top` | 4 s | At the large sign — turn right into the room corridor. `wrongTimeoutMs: 15000` |
| 4 | ar | straight | `signal ≥ 2` | 3 s | In the new corridor; banner "Your destination is on your right" appears |
| 5 | arrived | — | `door ≥ 2` + `signal ≥ 1` | — | Reached Room 124 |

### Deviation alerts
Two scenarios fire the existing `<DeviationAlert>`:
- **Step 0 — bin in view**: `wrongTrigger: ["bin"]`, `wrongMinFrames: 4`. If YOLO sees a bin at the elevator, the user is facing the wrong way.
- **Step 3 — no turn**: `wrongTimeoutMs: 15000`. If 15 s elapse on step 3 without advancing, the user probably walked past the large sign without turning right.

### Step notice
Step 4 declares `notice: "destination_right"` — `ArNav.tsx` renders a cyan-glow banner near the bottom while on that step, localised via `ar.notice.destination_right` (it / en / pt).

The accessible toggle currently mirrors the standard route (we already start at the elevator — no stairs to avoid). The flag still flips visual emphasis in the UI but doesn't change the path.

---

## AR Overlay

`AROverlay` renders only two things now:
1. A subtle warm radial tint over the camera feed (style continuity with the rest of the app)
2. The cyan **PNG** arrow, loaded from `/arrows/arrow-{straight,right,left}.png`

### Arrow layering
Three nested divs so the transform stack doesn't fight:
- Outer — `position: absolute, left: 50%, top: 72%` + `transform: translate(-50%,-50%)` for centering
- Middle — `transform: rotate(Xdeg)` with a 400 ms ease-out transition (X always 0° currently because the artwork is pre-oriented)
- Inner — `.pulse-cyan` class for the breath animation

### Pulse animation
`@keyframes pulse-cyan` animates only `transform: scale(1 → 1.05)` and `opacity (1 → 0.85)`. The cyan halo is rendered by a **static** `filter: drop-shadow(0 0 20px rgba(168, 227, 245, 0.85))` on the `.pulse-cyan` element — it grows/shrinks with the scale visually (since the parent's transform also scales the rendered glow) but the blur radius itself never animates, which avoids the chunky "scatti" you'd otherwise get from per-frame filter recomputation.

### Arrow bounding box
220×220 CSS px square, `object-fit: contain`. PNGs are at least 2× this (≥440 px on the long edge) for crisp retina rendering. To swap artwork, replace the three files in `web/public/arrows/`.

---

## YOLO Model

Real client-side YOLOv8n via TensorFlow.js (CPU backend, ~3 FPS throttle, NMS post-processing). 7 classes (order matters — must match `CLASS_NAMES` and `DetectionClass`):

| Idx | Class | Used as |
|-----|-------|---------|
| 0 | `path2class` | QR mark itself (mostly unused at runtime) |
| 1 | `bin` | Wrong-direction trigger at step 0 |
| 2 | `door` | Trigger for steps 2, 3, 5 |
| 3 | `elevator` | Trigger for step 1 |
| 4 | `painting` | (Currently not a step trigger) |
| 5 | `signal` | Trigger for steps 1, 3, 4, 5 |
| 6 | `vent` | (Currently not a step trigger) |

Re-training: update the Roboflow dataset, re-export `model.export(format='tfjs', imgsz=320)` from Colab, replace files under `web/public/models/yolov8n_web_model/`, update `CLASS_NAMES`/`DetectionClass` only if the class taxonomy changes.

The detection service public API is stable: `subscribe(listener)`, `start()`, `stop()`, `DetectionFrame`, `Detection`, `BBox` (normalized 0..1). `useStepAdvancer` subscribes directly — `ArNav` no longer needs its own detection state since bboxes are not drawn.

---

## LLM Assistant — RAG sections in the system prompt

`supabase/functions/chat-assistant/index.ts:buildSystemPrompt` injects, in order:

1. **USER CONTEXT** — runtime values: location, destination, current instruction, mode, accessibility, language, current step, totalSteps, recent detections.
2. **KNOWN MAP** — setting + the numbered route landmarks (elevator/QR, painting, fire-alarm sign, bathroom sign, large sign, two final doors) + useful facts (~32 m, ~1-2 min, multilingual term mapping, accessible note).
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
- Mobile viewport handling: 100dvh, env(safe-area-inset-bottom) for FAB and notice banner, html background tinted beige so iOS overscroll never goes white
- AR cyan PNG arrow (3 pre-oriented assets) with smooth static-halo pulse animation
- Real YOLOv8n inference client-side, NMS, ~3 FPS, 7 classes
- 6-step navigation machine with **composite AND triggers** (count, position, growing, closeTogether) + per-step **minDwellMs** throttling
- Two-channel deviation alert (YOLO-class wrong trigger + timer)
- Per-step `notice` banner (currently used at step 4: "destination on right")
- 4-step text mode (it/en/pt)
- L-shaped MiniFloorPlan matching real corridor geometry (6 nodes following the 6 steps)
- Real photo of Room 124 door as hero image on /destination and as 56×56 thumbnail on /arrived
- AI assistant streaming from Groq via deployed Supabase edge function, public access (`--no-verify-jwt`), rich RAG system prompt
- Assistant sheet at ~97% opacity (warm-sand) with strong blur — background no longer bleeds through
- Production-clean AR view: no demo pill, no debug overlay, no detection bboxes drawn
- QR code generated (`docs/qr-elevator.svg`) with embedded Path2Class logo; favicon SVG generated on warm beige tile
- Production deploy on Vercel with auto-deploy on push to `main`; SPA rewrite rule in `vercel.json` so `/landing` etc. resolve client-side

### 🟡 Partial / known limitations
- The 4 text-mode steps are coherent with the route description but **need on-site verification** with the real corridor.
- The 6-step YOLO trigger thresholds (confidence, frames, dwell) are first-pass values and may need tuning during real-world testing.
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
7. **`guidedNavigation.ts`** is still present but no longer referenced from `AssistantSheet.tsx`. Either delete the file + its i18n keys, or wire it back in if the deterministic flow is wanted as a no-LLM fallback.

---

## Next Steps (Prioritized)

### 1. Print and place the physical QR
`docs/qr-elevator.svg` is ready. Open it in a browser, Ctrl+P, A4, laminate, stick on the wall in front of the 1st-floor elevators. Confirm scanning on iOS Safari and Android Chrome takes you to the live app.

### 2. Field-tune the YOLO step machine
The 6-step machine in `corridor.json` is the heart of the AR navigation, and its triggers/thresholds are first-pass values. Walk the corridor with the phone pointing forward; if a step doesn't advance where expected, adjust:
- `minConfidence` (drop to 0.3 if landmarks are flickering at the edge of recognition)
- `minFrames` (drop to 1 if YOLO is missing one frame out of three)
- `minDwellMs` (raise if rapid double-advances; lower if the arrow lingers too long)
- Composite conditions (`position`, `growing`, `closeTogether`) if a step is misfiring on the wrong scene

All in `web/src/data/corridor.json` — no recompile, just push and Vercel redeploys.

### 3. Capture real landmark text
The text-mode steps and the assistant RAG describe an imagined route. After walking the corridor once, refine the strings in:
- `web/src/i18n/locales/{it,en,pt}.json` → `text_nav.steps_standard`, `text_nav.steps_accessible`
- The system prompt in `supabase/functions/chat-assistant/index.ts` (then redeploy)

### 4. User testing
Have 3-5 people who don't know the corridor try the app end-to-end (QR scan → AR navigation → arrival). Note where they hesitate, what they ask the assistant, whether the deviation alerts fire correctly.

### 5. Decide guided-navigation fallback fate
`guidedNavigation.ts` and the `assistant.guided.*` i18n keys are still in the repo but unused. Either delete (cleaner) or wire them back into `AssistantSheet.tsx` as the offline fallback for when Groq is unreachable.

### 6. Decide backend strategy
Three options:
- **(a) Delete `backend/`** — current demo doesn't need it; simpler.
- **(b) Keep as reference** — useful when extending to multiple buildings (`campus_graph.json` has the full graph).
- **(c) Use as server-side YOLO** — would speed up detection and remove TFJS from the bundle, but requires re-wiring the detection service and hosting the FastAPI somewhere.

### 7. Extend beyond the MVP corridor
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
- FAB, assistant sheet, and AR notice banner use `position: fixed/absolute` with `env(safe-area-inset-bottom)` insets.
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
72f0879  Polish AR overlay: banner placement + centered text + smooth halo
a2d8bb6  Remove detection bbox highlights from AR overlay
8f245ea  Replace 'Notice board' with International & Employability Office
70a085d  Update Room 124 door photo
f1cbb5e  Door photo: object-fit cover → contain (no crop)
4bda219  Add Room 124 door photo + align DoorArt path
ec9a4f5  Update destination: 1 min / 32 m + real door photo
ff2e082  Remove demo + debug overlays from AR screen
37107d3  Simplify arrival trigger: 2 doors + 1 signal, no position constraints
ac59c25  Revert pulse-cyan animation to original values
2b8526a  Smoother arrow breathing + 37% larger bounding box
df493e6  Lower AR arrow position from 58% to 72% of viewport height
b03d194  Add AR arrow PNGs + zero rotation (artwork is pre-oriented)
bd81576  Switch AR arrow from inline SVG to PNG assets
78247a5  Add per-step minDwellMs to throttle rapid advancement
6e17a10  Add intermediate step 4: arrow straightens + 'destination on right' banner
fd36047  Loosen step 1→2 trigger thresholds
9d3730a  Simplify step 1→2 trigger: any 2 doors visible
0087541  Rewrite YOLO step machine with composite triggers
cb52a21  Fix AR arrow centering + rotation (pulse-cyan was clobbering transform)
760d991  Fix assistant sheet: opaque background, remove Yes/No guided lock-in
```

Use `git log --oneline` for the full history.
