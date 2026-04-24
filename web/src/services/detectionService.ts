/**
 * detectionService — stream of object-detection frames.
 *
 *  MOCK IMPLEMENTATION — replace with real YOLOv8 TFJS inference.
 *
 *  The DL team owns this file. Everything above the "TODO(dl-team): real
 *  YOLO scaffold" marker below is placeholder behaviour; replace only
 *  the body of `start()` (and the tick function) with the inference loop
 *  shown in the scaffold.
 *
 *  Do NOT change the public interface (subscribe/start/stop/types) — the
 *  AR screen, InstructionBanner and overlay all consume it and will keep
 *  working unmodified once real detections arrive.
 */

export type DetectionClass =
  | 'sign_room_number'
  | 'sign_building_name'
  | 'direction_arrow'
  | 'entrance_door'
  | 'elevator_door'
  | 'staircase'
  | 'ramp'
  | 'path2class_qr'
  | 'campus_landmark';

/** Bounding box in normalised video-frame coordinates (0..1). */
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Detection {
  readonly class: DetectionClass;
  readonly label: string;
  readonly bbox: BBox;
  readonly confidence: number;
}

export interface DetectionFrame {
  readonly timestamp: number;
  readonly detections: readonly Detection[];
}

type Listener = (frame: DetectionFrame) => void;

/* ------------------------------------------------------------------ */
/*  MOCK implementation                                                */
/* ------------------------------------------------------------------ */

const listeners = new Set<Listener>();
let intervalId: number | null = null;
let tickIndex = 0;

/**
 * Scripted detection sequence that matches the prototype's visual flow
 * (Room 17 W in view, then the elevator becomes visible, etc.). Each
 * tick jitters the bboxes slightly so the overlay feels live.
 */
const SCRIPT: ReadonlyArray<ReadonlyArray<Omit<Detection, 'confidence'>>> = [
  [],
  [
    {
      class: 'sign_room_number',
      label: 'Room 17 W',
      bbox: { x: 0.06, y: 0.35, w: 0.14, h: 0.32 },
    },
  ],
  [
    {
      class: 'sign_room_number',
      label: 'Room 17 W',
      bbox: { x: 0.07, y: 0.35, w: 0.14, h: 0.32 },
    },
    {
      class: 'direction_arrow',
      label: 'Arrow',
      bbox: { x: 0.45, y: 0.5, w: 0.1, h: 0.08 },
    },
  ],
  [
    {
      class: 'sign_room_number',
      label: 'Room 17 W',
      bbox: { x: 0.08, y: 0.34, w: 0.14, h: 0.32 },
    },
    {
      class: 'elevator_door',
      label: 'Elevator',
      bbox: { x: 0.26, y: 0.32, w: 0.12, h: 0.28 },
    },
  ],
];

function emit(frame: DetectionFrame): void {
  for (const listener of listeners) listener(frame);
}

function tick(): void {
  const base = SCRIPT[tickIndex++ % SCRIPT.length];
  const frame: DetectionFrame = {
    timestamp: performance.now(),
    detections: base.map((d) => ({
      ...d,
      confidence: 0.7 + Math.random() * 0.25,
      bbox: {
        x: d.bbox.x + (Math.random() - 0.5) * 0.006,
        y: d.bbox.y + (Math.random() - 0.5) * 0.006,
        w: d.bbox.w,
        h: d.bbox.h,
      },
    })),
  };
  emit(frame);
}

export const detectionService = {
  /** Subscribe to detection frames. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Begin emitting frames at ~2.5 FPS. Safe to call while already running. */
  start(): void {
    if (intervalId !== null) return;
    tickIndex = 0;
    intervalId = window.setInterval(tick, 400);
  },
  /** Stop emitting. Subscribers remain subscribed; call again to resume. */
  stop(): void {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  },
};

/* ------------------------------------------------------------------ */
/*  TODO(dl-team): real YOLO scaffold                                  */
/*                                                                     */
/*  1. Drop the exported TFJS graph model into:                        */
/*       public/models/yolov8n_web_model/model.json (+ shards)         */
/*                                                                     */
/*  2. Install runtime deps (already in package.json):                 */
/*       @tensorflow/tfjs                                              */
/*                                                                     */
/*  3. Replace the MOCK section above with roughly:                    */
/*                                                                     */
/*   import * as tf from '@tensorflow/tfjs';                           */
/*                                                                     */
/*   const CLASS_NAMES: DetectionClass[] = [                           */
/*     'sign_room_number', 'sign_building_name', 'direction_arrow',    */
/*     'entrance_door',   'elevator_door',      'staircase',           */
/*     'ramp',             'path2class_qr',     'campus_landmark',     */
/*   ];                                                                */
/*                                                                     */
/*   let model: tf.GraphModel | null = null;                           */
/*   let rafId: number | null = null;                                  */
/*   let source: HTMLVideoElement | null = null;                       */
/*                                                                     */
/*   async function ensureModel() {                                    */
/*     if (!model) model = await tf.loadGraphModel(                    */
/*       '/models/yolov8n_web_model/model.json');                      */
/*   }                                                                 */
/*                                                                     */
/*   async function runFrame() {                                       */
/*     if (!model || !source) return;                                  */
/*     const [t, b] = tf.tidy(() => {                                  */
/*       const img = tf.browser.fromPixels(source)                     */
/*         .resizeBilinear([640, 640]).div(255).expandDims(0);         */
/*       const out = model.execute(img) as tf.Tensor;                  */
/*       return [out, img];                                            */
/*     });                                                             */
/*     // Apply NMS + decode to normalised [x,y,w,h] + class idx +     */
/*     // confidence, then emit() a DetectionFrame of real Detections. */
/*     t.dispose(); b.dispose();                                       */
/*   }                                                                 */
/*                                                                     */
/*   export const detectionService = {                                 */
/*     subscribe(listener) { listeners.add(listener); ... },           */
/*     async start() {                                                 */
/*       await ensureModel();                                          */
/*       source = document.querySelector('video#camera-feed');         */
/*       const loop = () => { runFrame(); rafId = requestAnimationFrame(loop); }; */
/*       loop();                                                       */
/*     },                                                              */
/*     stop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; },*/
/*   };                                                                */
/*                                                                     */
/*  Do NOT commit the model shards to git — they should be fetched     */
/*  at build time from the model registry.                             */
/* ------------------------------------------------------------------ */
