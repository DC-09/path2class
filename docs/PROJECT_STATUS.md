# Path2Class — Project Status

## What Path2Class is

Path2Class is a **university indoor wayfinding web app** that helps students and visitors find classrooms, offices and services inside a campus. The premise is simple: university buildings are mazes, printed floor plans don't help anyone who doesn't already know where they are, and Google Maps stops at the front door. Path2Class fixes this with **physical QR codes** placed at key checkpoints in the building (elevators, entrances, junctions): the user scans one with their phone, the app instantly knows where they are, asks where they want to go, and walks them through it step by step.

The experience has three components working together. **Augmented reality** overlays a cyan arrow on the live camera feed so the user sees where to go by simply looking at the corridor in front of them. **Visual AI (YOLO)** recognises doors, signs, elevators, bins, paintings, vents and notice boards in real time — recognition runs **invisibly in the background** (bboxes are no longer drawn on screen) and drives the step state machine. A **conversational assistant (Llama 3.3 70B on Groq)** answers natural-language questions ("Where am I?", "I'm lost", "What can you do?") in Italian, English or Portuguese, backed by a hand-rolled RAG that walks the user step by step, recovers them if they take a wrong turn, answers technical FAQs and explains the project.

The app is live at **[path2class.vercel.app](https://path2class.vercel.app)**.

---

## How to download and run the project from GitHub

This guide is for someone who has never used a terminal. Follow the steps in order.

### What you need to install first (one-time setup)

1. **Git** — the program that downloads the code from GitHub
   - Go to https://git-scm.com/downloads
   - Download the version for your system (Windows / Mac / Linux), install with the default options

2. **Node.js** — the runtime that runs the web app
   - Go to https://nodejs.org
   - Download the **LTS** version (the recommended one, not "Current")
   - Install with the default options

3. **Visual Studio Code** (recommended, not required) — a code editor with a handy built-in terminal
   - https://code.visualstudio.com

To verify everything is installed, open the terminal (Windows: press the Windows key → type "PowerShell" → enter) and run:
```
git --version
node --version
npm --version
```
If each one returns a version number, you're ready.

### Download the project

Open the terminal in the folder where you want to put the project (e.g. `Documents`), then:

```sh
git clone https://github.com/DC-09/path2class.git
cd path2class
```

The project is now downloaded and you're inside its folder.

### Start the web app

```sh
cd web
npm install
```

`npm install` downloads all the required libraries (1-2 minutes the first time). If you see `warning` lines, ignore them — that's normal. If you see `error` lines, stop and ask.

When it's done, start the dev server:

```sh
npm run dev
```

You'll see something like:
```
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open your browser and go to that address. The web app is live.

To stop it: go back to the terminal and press `Ctrl + C`.

### Trying it on a phone (3 options)

**Option A — Use the live deployed version**: open [path2class.vercel.app](https://path2class.vercel.app) on the phone. Easiest path. The camera works because Vercel serves the app over HTTPS.

**Option B — Scan the physical QR**: print `docs/qr-elevator.svg` (from the project folder) and stick it in front of the elevator. Scan with your phone and it takes you straight into the app.

**Option C — Local testing via ngrok**: if you want to test changes you made on your computer:
1. Go to https://ngrok.com, create a free account, download ngrok, authenticate with the command it gives you
2. Leave `npm run dev` running
3. In a second terminal: `ngrok http 5173`
4. ngrok gives you a URL like `https://something.ngrok-free.app`. Open it on your phone in any browser. When the app asks for camera permission, accept.

### Updating the project in the future

When someone (you or a teammate) pushes new changes to GitHub, pull them like this:

```sh
cd path2class
git pull
cd web
npm install         # only if libraries changed
npm run dev
```

Vercel auto-deploys every `git push` to `main`, so the online version also updates by itself within 1-2 minutes.

---

## What has been built so far

The **UI is complete, live and production-clean**. Every screen works: welcome screen (Splash, redesigned per a dedicated design handoff with a floating logo + 3 step cards + "Get started" CTA), Landing with destination search, destination confirmation showing a **real photo** of the Room 124 door, camera permission prompt, live AR navigation with a custom cyan PNG arrow, text navigation with an L-shaped floor plan, arrival screen. The entire visual language is **Liquid Glass** — translucent surfaces, warm sand background, cyan accents.

The app is **multilingual** (Italian, English, Portuguese) with auto-detection on first launch. It remembers recently searched destinations. It is **keyboard-accessible**, has screen-reader labels, and respects reduced-motion preferences.

The **AR screen has been stripped of every debug affordance**: the demo pill (Wrong turn / Next / Arrive / A11y) and the highlighted bboxes around recognised objects are gone. What remains is the camera feed, the cyan arrow that rotates/grows/shrinks with a diffused halo, the top status bar, the controls (close / switch to text), the informational banner when active, and the assistant FAB. YOLO still runs hidden underneath and drives step advancement.

The **AI assistant is active and working in production**. It opens as a near-opaque bottom sheet (sand-coloured at 97%) from any screen and receives streaming token-by-token responses from **Llama 3.3 70B on Groq** (via a Supabase Edge Function). The system prompt is a real **RAG**: it describes the full route from the elevator to Room 124 with every landmark, handles recovery when the user goes the wrong way, can answer technical questions (camera permission, language, common issues), knows its own capabilities, and talks about the project in plain language without diving into tech details. **No more "guided Yes/No" mode** — the "Guide me to Room 124" chip now sends the request straight to the model, which replies naturally thanks to the RAG.

There is also a **Python backend** (FastAPI) with a YOLO service, an LLM service and a full campus graph (multiple buildings, floors, rooms). It was designed as the central service before the team decided to use Supabase for the assistant. **It is not wired to the active web app** — it stays as a reference for when the map is extended.

## What works today

- The complete visual interface on mobile and desktop, deployed on Vercel
- Redesigned Splash screen, favicon, real photo of the Room 124 door
- Physical QR scan → opens directly into the app at the Landing
- Live camera in AR mode (HTTPS via Vercel or ngrok for dev)
- **AR arrows as custom PNGs** (`arrow-straight.png`, `arrow-right.png`, `arrow-left.png`) in `public/arrows/` — swap the files to swap the artwork. Rendered inside a 220×220 box with `object-fit: contain`. Stable cyan halo (static drop-shadow) + smooth pulse via `scale` + `opacity`
- **Real object recognition** with the YOLOv8n model trained on the target corridor (TF.js CPU backend, ~3 FPS, NMS post-processing) — 7 classes: `path2class`, `bin`, `door`, `elevator`, `painting`, `signal`, `vent`
- **6-step state machine** with automatic AR advancement: the arrow changes direction and the floor-plan dot advances when YOLO satisfies a **combination of AND conditions** (minimum counts, position inside the frame, bbox growth over time, spatial clustering of detections)
- **Per-step `minDwellMs`**: minimum dwell time before the next trigger can fire. Prevents rapid-fire advancement when consecutive steps share landmarks
- **"Wrong direction" alert** in 2 scenarios: (1) at the elevator, if YOLO sees a bin the user is facing the wrong way; (2) at the large sign, if the user doesn't turn right within 15 seconds
- **"Destination on right" informational banner** that appears at the penultimate step (centered, bottom, with iOS safe-area inset)
- **4-step text mode**, with an L-shaped floor plan that mirrors the real corridor geometry (main hallway + perpendicular branch with Room 124 at the end)
- Live AI assistant: streaming token-by-token, context always up to date (knows your step, destination, recent detections), rich RAG covering full route, capabilities, recovery, technical FAQ, project info
- Assistant sheet with opaque background (sand at 97%) — no more see-through that revealed content behind it
- Language selector, accessible-route toggle, recent destinations saved locally

## What does NOT work yet

- **The Python backend is not wired to the web app**: the old HTML frontend used it, the new one doesn't. For now it's "isolated" — useful as a reference when the map is extended beyond the single corridor.
- **Limited map**: the system handles only one corridor (1st floor, from the elevator to Room 124) — the demo MVP. The backend has a wider graph but it's not connected to the new UI.
- **Navigation steps and on-screen text depend on real landmarks**: the 4 text-mode steps and the assistant's RAG strings are coherent with the described route, but they need to be verified by physically walking the corridor and refined if anything doesn't match.

## Next steps (in priority order)

1. **Print the physical QR**: the file is ready at `docs/qr-elevator.svg` (Path2Class logo in the centre, scannable code). Open the file in a browser, Ctrl+P, print A4, laminate and stick it in front of the 1st-floor elevator.
2. **Field-tune the YOLO triggers in the real corridor**: the 6 steps use composite conditions (count, position, growing, closeTogether) and dwell times. Adjustments will likely be needed after walking tests. All parameters live in `web/src/data/corridor.json` — change and commit.
3. **Real user testing**: have 3-5 people who don't know the corridor try the app. Note where they hesitate, what they misunderstand, whether the assistant answers well.
4. **Extend the map beyond a single corridor**: wire the full backend graph (multiple buildings and floors) into the new interface. Bigger job — depends on how far you want to push the thesis.

## Known issues

- **Recent-destination labels don't re-translate after saving**: if you save "Room 124" in English and then switch to Italian, it stays in English. Easy fix later — save the ID and translate at render time.
- **iOS requires a user gesture before `DeviceOrientationEvent`**: we don't use it today (the AR arrow is driven by the app store), but if we want compass-oriented arrows in the future, an explicit permission step needs to be added.
- **JavaScript bundle ~1.4 MB** (gzip ~370 KB) — heavy because of TensorFlow. Could be lazy-loaded only when entering AR mode, but it's fine for the demo.
