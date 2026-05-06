import * as tf from '@tensorflow/tfjs';

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
/*  Config                                                              */
/* ------------------------------------------------------------------ */

const MODEL_PATH = '/models/yolov8n_web_model/model.json';
const INPUT_SIZE = 320;
const CONF_THRESHOLD = 0.35;
const IOU_THRESHOLD = 0.45;

const CLASS_NAMES: DetectionClass[] = [
  'sign_room_number',
  'sign_building_name',
  'direction_arrow',
  'entrance_door',
  'elevator_door',
  'staircase',
  'ramp',
  'path2class_qr',
  'campus_landmark',
];

const CLASS_LABELS: Record<DetectionClass, string> = {
  sign_room_number: 'Room Sign',
  sign_building_name: 'Building Sign',
  direction_arrow: 'Arrow',
  entrance_door: 'Door',
  elevator_door: 'Elevator',
  staircase: 'Stairs',
  ramp: 'Ramp',
  path2class_qr: 'QR Code',
  campus_landmark: 'Landmark',
};

/* ------------------------------------------------------------------ */
/*  Internal state                                                      */
/* ------------------------------------------------------------------ */

const listeners = new Set<Listener>();
let model: tf.GraphModel | null = null;
let rafId: number | null = null;
let source: HTMLVideoElement | null = null;

function emit(frame: DetectionFrame): void {
  for (const listener of listeners) listener(frame);
}

/* ------------------------------------------------------------------ */
/*  NMS helpers                                                         */
/* ------------------------------------------------------------------ */

function iou(
  a: [number, number, number, number],
  b: [number, number, number, number],
): number {
  const ix1 = Math.max(a[0], b[0]);
  const iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]);
  const iy2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const aArea = (a[2] - a[0]) * (a[3] - a[1]);
  const bArea = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (aArea + bArea - inter + 1e-6);
}

function applyNms(
  boxes: [number, number, number, number][],
  scores: number[],
): number[] {
  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const suppressed = new Set<number>();
  const keep: number[] = [];
  for (const i of order) {
    if (suppressed.has(i)) continue;
    keep.push(i);
    for (const j of order) {
      if (j !== i && !suppressed.has(j) && iou(boxes[i], boxes[j]) > IOU_THRESHOLD) {
        suppressed.add(j);
      }
    }
  }
  return keep;
}

/* ------------------------------------------------------------------ */
/*  Inference loop                                                      */
/* ------------------------------------------------------------------ */

async function runFrame(): Promise<void> {
  if (!model || !source || source.readyState < 2) return;

  // Preprocess and run inference inside tidy to avoid tensor leaks.
  // Output shape from Ultralytics TFJS export: [1, 13, 2100]
  //   axis 1: rows 0-3 = cx,cy,w,h (in pixels relative to INPUT_SIZE)
  //           rows 4-12 = class scores for the 9 classes
  //   axis 2: 2100 predictions = 40×40 + 20×20 + 10×10 grid cells
  const { data, shape } = tf.tidy(() => {
    const img = tf.browser
      .fromPixels(source!)
      .resizeBilinear([INPUT_SIZE, INPUT_SIZE])
      .div(255.0)
      .expandDims(0); // [1, 320, 320, 3]

    const out = model!.execute(img) as tf.Tensor;
    return { data: out.dataSync() as Float32Array, shape: out.shape };
  });

  const [, , numPredictions] = shape as [number, number, number];

  const boxes: [number, number, number, number][] = [];
  const scores: number[] = [];
  const classIds: number[] = [];

  for (let i = 0; i < numPredictions; i++) {
    // Find best class score for this prediction
    let maxScore = 0;
    let classId = 0;
    for (let c = 0; c < CLASS_NAMES.length; c++) {
      const s = data[(4 + c) * numPredictions + i];
      if (s > maxScore) {
        maxScore = s;
        classId = c;
      }
    }
    if (maxScore < CONF_THRESHOLD) continue;

    // Decode cx,cy,w,h (pixels) → x1,y1,x2,y2 (normalised 0-1)
    const cx = data[0 * numPredictions + i] / INPUT_SIZE;
    const cy = data[1 * numPredictions + i] / INPUT_SIZE;
    const w = data[2 * numPredictions + i] / INPUT_SIZE;
    const h = data[3 * numPredictions + i] / INPUT_SIZE;

    boxes.push([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]);
    scores.push(maxScore);
    classIds.push(classId);
  }

  const kept = applyNms(boxes, scores);

  const detections: Detection[] = kept.map((idx) => {
    const [x1, y1, x2, y2] = boxes[idx];
    const cls = CLASS_NAMES[classIds[idx]];
    return {
      class: cls,
      label: CLASS_LABELS[cls],
      bbox: {
        x: Math.max(0, x1),
        y: Math.max(0, y1),
        w: Math.min(1, x2) - Math.max(0, x1),
        h: Math.min(1, y2) - Math.max(0, y1),
      },
      confidence: scores[idx],
    };
  });

  emit({ timestamp: performance.now(), detections });
}

/* ------------------------------------------------------------------ */
/*  Public interface (unchanged from mock — drop-in replacement)       */
/* ------------------------------------------------------------------ */

export const detectionService = {
  /** Subscribe to detection frames. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Load the model and begin inference on the live camera feed. */
  async start(): Promise<void> {
    if (rafId !== null) return;
    await tf.setBackend('cpu');
    await tf.ready();
    if (!model) model = await tf.loadGraphModel(MODEL_PATH);
    source = document.querySelector<HTMLVideoElement>('video#camera-feed');
    let lastRun = 0;
    const loop = (): void => {
      const now = performance.now();
      if (now - lastRun > 300) {
        lastRun = now;
        runFrame();
      }
      rafId = requestAnimationFrame(loop);
    };
    loop();
  },

  /** Stop inference. Subscribers remain; call start() again to resume. */
  stop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  },
};
