# Path2Class

**QR-activated indoor wayfinding for university campuses, powered by real-time YOLO detection and a Llama-driven AI assistant.**

[![Live demo](https://img.shields.io/badge/Live-path2class.vercel.app-7BC4D9)](https://path2class.vercel.app)
[![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20TypeScript%20%2B%20Vite-1E3A5F)](web/README.md)
[![YOLO](https://img.shields.io/badge/YOLOv8n-TF.js%20client--side-A8E3F5)](web/public/models/yolov8n_web_model/)
[![LLM](https://img.shields.io/badge/LLM-Llama%203.3%2070B%20via%20Groq-F5B946)](supabase/functions/chat-assistant/index.ts)

University buildings are mazes. Printed floor plans don't help anyone who doesn't already know where they are, and Google Maps stops at the front door. Path2Class fixes that with **physical QR codes** on the wall at key checkpoints: you scan one, the app instantly knows your location, asks where you want to go, and walks you through it with an **AR overlay** on your phone's camera. Object recognition (YOLO running entirely in the browser) tracks landmarks like doors, signs and elevators to advance the route automatically, while a streaming **AI assistant** answers natural-language questions in Italian, English and Portuguese.

This is a **multi-course master's project** (Emerging Technologies + Deep Learning + Generative AI). The MVP scope is **one corridor**: scan the QR in front of the elevators on the 1st floor → guided to Room 124.

---

## Live demo

- **Web app**: https://path2class.vercel.app
- **Print-ready QR** (encodes the elevator deeplink): [`docs/qr-elevator.svg`](docs/qr-elevator.svg)

The site is served over HTTPS so the camera works directly on iOS Safari / Android Chrome — no install, no PWA, no app store. Just open the link or scan the QR.

---

## How it works

| Layer | What it does |
|---|---|
| **AR overlay** | Live camera feed with a cyan PNG arrow that points straight / right / left. Three pre-oriented PNG assets in [`web/public/arrows/`](web/public/arrows/); swap the files to swap the artwork. |
| **YOLO detection** | YOLOv8n exported to TensorFlow.js, running entirely client-side at ~3 FPS on the CPU backend. 7 classes: `path2class`, `bin`, `door`, `elevator`, `painting`, `signal`, `vent`. Runs invisible — no bboxes are drawn. |
| **Step machine** | 6 steps in [`web/src/data/corridor.json`](web/src/data/corridor.json). Each step advances when a composite AND condition over the next step's detections holds. Conditions support: `minCount`, `position` (left/right/center/top/middle and corners), `growing` (bbox area trending up), `closeTogether` (spatial clustering), plus per-step `minDwellMs` to throttle rapid advancement. |
| **Deviation alerts** | Two channels: a wrong-class trigger (e.g. seeing a bin at the elevator means you're facing the wrong way) and a wrong-timeout (no advancement within N seconds at the turn point). |
| **AI assistant** | Llama 3.3 70B via Groq, streamed token-by-token through a Supabase Edge Function. The system prompt is a hand-rolled RAG covering the full route, step-aware recap, wrong-turn recovery, capabilities, FAQ, and project info. Multilingual (IT / EN / PT) following the user's session language. |
| **Text fallback** | A 4-step text mode with an L-shaped mini floor plan, used automatically when camera permission is denied. |

---

## Tech stack

**Frontend** ([`web/`](web/))
Vite 8 · React 19 · TypeScript 6 (strict) · Tailwind CSS v3 · React Router 7 · Zustand · react-i18next · @tensorflow/tfjs · Lucide icons (plus custom inline SVG)

**LLM service** ([`supabase/functions/chat-assistant/`](supabase/functions/chat-assistant/))
Deno Supabase Edge Function proxying streaming SSE from Groq's OpenAI-compatible Chat Completions API.

**Hosting**
Vercel (web app, auto-deploy on push to `main`) · Supabase (edge function, `--no-verify-jwt`)

**Detection model**
Trained on Roboflow (dataset v3, 7 classes), exported with `model.export(format='tfjs', imgsz=320)`. See [`yolo/`](yolo/) for the training scripts.

**Reference / legacy**
[`backend/`](backend/) holds a FastAPI multi-building implementation (campus graph + server-side YOLO + LLM service) that the original prototype used. Not wired to the current web app — kept as a reference for when the map is extended beyond the single corridor.

---

## Quick start

```sh
git clone https://github.com/DC-09/path2class.git
cd path2class/web
npm install
npm run dev          # http://localhost:5173
```

To use the AI assistant locally you also need a deployed Supabase edge function and a `web/.env.local` containing `VITE_ASSISTANT_ENDPOINT=...`. See [`web/README.md`](web/README.md) for the full deploy walkthrough.

The dev server is HTTP only, so the camera doesn't work locally. For mobile/AR testing:
- Use the production deploy at https://path2class.vercel.app, or
- Tunnel `localhost:5173` over `ngrok` (gives you an HTTPS URL the phone can hit)

---

## Repository structure

```
path2class/
├── README.md                   This file
├── LICENSE                     MIT
├── Path2Class_Planning_e_Progettazione.md   Original planning doc
├── PROTOTYPE_*.{html,jsx}      Static visual prototypes (reference only)
├── vercel.json                 Vercel build config (cd web && npm run build)
│
├── docs/
│   ├── HANDOFF.md              Developer handoff (detailed, English)
│   ├── PROJECT_STATUS.md       Non-technical project status (English)
│   └── qr-elevator.svg         Print-ready QR
├── scripts/                    Node utilities (QR + favicon generators)
│
├── web/                        ACTIVE FRONTEND
│   ├── public/                 favicon, logos, door-124.jpeg, arrows/, YOLO model
│   └── src/                    pages, components, services, hooks, stores, i18n, data
│
├── supabase/functions/
│   └── chat-assistant/         Deno edge function (deployed)
│
├── backend/                    LEGACY — FastAPI app, not wired to web/
│   └── app/                    Routers, services, multi-building graph
│
└── yolo/                       Training pipeline
    ├── config/                 Roboflow dataset config
    ├── models/                 (.gitkeep — trained weights stay local)
    └── scripts/                train.py · evaluate.py · export_model.py · create_sample_data.py
```

Full directory tree with annotations: [`docs/HANDOFF.md`](docs/HANDOFF.md#directory-structure)

---

## Documentation

| Doc | Audience |
|---|---|
| [`README.md`](README.md) | Anyone visiting the repo (you're here) |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Project stakeholders, non-technical reviewers |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | A developer picking up the project — detailed technical reference |
| [`web/README.md`](web/README.md) | Frontend developers — deploy, screen flow, step machine reference |

---

## Credits

Master's project by Diego Casati, Niccolo Asti and Lidia Sapienza
