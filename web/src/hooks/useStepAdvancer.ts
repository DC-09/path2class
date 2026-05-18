import { useEffect, useRef } from 'react';
import { detectionService, type DetectionClass, type Detection, type BBox } from '../services/detectionService';

/**
 * Position constraint inside the normalised (0..1) video frame.
 * Coordinates use the bbox center.
 */
export type FramePosition =
  | 'left'
  | 'right'
  | 'center'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'top-right'
  | 'top-left'
  | 'middle-right'
  | 'middle-left'
  | 'bottom-right'
  | 'bottom-left';

export interface TriggerCondition {
  class: DetectionClass;
  /** Minimum number of detections of this class that must satisfy the constraint. Default 1. */
  minCount?: number;
  /** Optional spatial constraint on the bbox center inside the frame. */
  position?: FramePosition;
  /** When true, the largest matching bbox must be growing over the last few frames. */
  growing?: boolean;
  /** When true (with minCount >= 2), the matching bboxes must be spatially clustered. */
  closeTogether?: boolean;
}

export interface NavigationStep {
  id: number;
  kind: 'qr' | 'ar' | 'arrived';
  arrow: 'straight' | 'left' | 'right';
  /** All conditions in the array must hold simultaneously (AND). */
  trigger: TriggerCondition[];
  minConfidence: number;
  minFrames: number;
  /** YOLO classes that, when seen at this step, indicate wrong direction. */
  wrongTrigger?: DetectionClass[];
  /** Consecutive frames of wrongTrigger before deviation fires (default 3). */
  wrongMinFrames?: number;
  /** If set, fire deviation after this many ms of no advancement. */
  wrongTimeoutMs?: number;
  /** Optional i18n key (under ar.notice.*) for an info banner shown while on this step. */
  notice?: string;
}

interface AdvancerOptions {
  steps: NavigationStep[];
  currentStep: number;
  onAdvance: (nextStep: number) => void;
  onArrived: () => void;
  onDeviation?: () => void;
}

const WRONG_MIN_CONFIDENCE = 0.5;
const GROWING_WINDOW = 6;
const GROWING_RATIO = 1.2;
const CLOSE_TOGETHER_MAX_DIST = 0.35;

interface State {
  consecutive: number;
  wrongConsecutive: number;
  lastStep: number;
  arrivedFired: boolean;
  deviationFiredForStep: number;
  /** Rolling area window per (class+position) key, reset on step change. */
  areaWindows: Map<string, number[]>;
}

function bboxCenter(b: BBox): { x: number; y: number } {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** Format a trigger condition array as a compact, human-readable string. */
export function summarizeTrigger(trigger: TriggerCondition[]): string {
  if (!trigger || trigger.length === 0) return '—';
  return trigger
    .map((c) => {
      let s = c.class;
      const n = c.minCount ?? 1;
      if (n > 1) s += `×${n}`;
      if (c.position) s += `@${c.position}`;
      if (c.growing) s += '↑';
      if (c.closeTogether) s += '∩';
      return s;
    })
    .join(' + ');
}

/** Count how many detections of each class satisfy a class+position+conf filter. */
export function countByClass(
  detections: readonly Detection[],
  minConfidence: number,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of detections) {
    if (d.confidence < minConfidence) continue;
    counts[d.class] = (counts[d.class] ?? 0) + 1;
  }
  return counts;
}

function bboxArea(b: BBox): number {
  return b.w * b.h;
}

function matchesPosition(b: BBox, pos: FramePosition): boolean {
  const { x, y } = bboxCenter(b);
  const isLeft = x < 0.4;
  const isRight = x > 0.6;
  const isCenterX = x >= 0.35 && x <= 0.65;
  const isTop = y < 0.4;
  const isMiddleY = y >= 0.3 && y <= 0.7;
  const isBottom = y > 0.6;
  switch (pos) {
    case 'left':
      return isLeft;
    case 'right':
      return isRight;
    case 'center':
      return isCenterX;
    case 'top':
      return isTop;
    case 'middle':
      return isMiddleY;
    case 'bottom':
      return isBottom;
    case 'top-left':
      return isTop && isLeft;
    case 'top-right':
      return isTop && isRight;
    case 'middle-left':
      return isMiddleY && isLeft;
    case 'middle-right':
      return isMiddleY && isRight;
    case 'bottom-left':
      return isBottom && isLeft;
    case 'bottom-right':
      return isBottom && isRight;
    default:
      return true;
  }
}

function conditionKey(c: TriggerCondition): string {
  return `${c.class}:${c.position ?? ''}:${c.growing ? 'g' : ''}`;
}

function matchesCondition(
  detections: readonly Detection[],
  cond: TriggerCondition,
  minConfidence: number,
  state: State,
): boolean {
  const matches = detections.filter(
    (d) =>
      d.class === cond.class &&
      d.confidence >= minConfidence &&
      (!cond.position || matchesPosition(d.bbox, cond.position)),
  );

  const minCount = cond.minCount ?? 1;
  if (matches.length < minCount) {
    // Growing windows rely on a stable observation cadence — clear if the
    // detection disappears so re-acquisition starts fresh.
    if (cond.growing) state.areaWindows.delete(conditionKey(cond));
    return false;
  }

  if (cond.growing) {
    const key = conditionKey(cond);
    const currentMax = Math.max(...matches.map((d) => bboxArea(d.bbox)));
    const window = state.areaWindows.get(key) ?? [];
    window.push(currentMax);
    if (window.length > GROWING_WINDOW) window.shift();
    state.areaWindows.set(key, window);
    if (window.length < 4) return false;
    const firstAvg = (window[0] + window[1]) / 2;
    const lastAvg = (window[window.length - 1] + window[window.length - 2]) / 2;
    if (lastAvg < firstAvg * GROWING_RATIO) return false;
  }

  if (cond.closeTogether && minCount >= 2) {
    const top = [...matches]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, minCount);
    for (let i = 0; i < top.length; i++) {
      const ci = bboxCenter(top[i].bbox);
      for (let j = i + 1; j < top.length; j++) {
        const cj = bboxCenter(top[j].bbox);
        const dist = Math.hypot(ci.x - cj.x, ci.y - cj.y);
        if (dist > CLOSE_TOGETHER_MAX_DIST) return false;
      }
    }
  }

  return true;
}

/**
 * Subscribes to detectionService and advances to the NEXT step when EVERY
 * condition in that step's `trigger` array is satisfied for `minFrames`
 * consecutive frames. Reaching a step with kind="arrived" fires onArrived.
 *
 * Conditions may require a minimum count, a position inside the frame
 * (left/right/center/top/middle/bottom and corners), growth of the bbox
 * across a few frames ("getting closer"), or spatial clustering of the
 * detections ("two doors close together").
 *
 * Also fires onDeviation when:
 *  - the current step's wrongTrigger is detected for wrongMinFrames frames, or
 *  - the current step has been active for wrongTimeoutMs without advancing.
 */
export function useStepAdvancer({
  steps,
  currentStep,
  onAdvance,
  onArrived,
  onDeviation,
}: AdvancerOptions): void {
  const stateRef = useRef<State>({
    consecutive: 0,
    wrongConsecutive: 0,
    lastStep: -1,
    arrivedFired: false,
    deviationFiredForStep: -1,
    areaWindows: new Map(),
  });

  useEffect(() => {
    if (stateRef.current.lastStep !== currentStep) {
      stateRef.current.consecutive = 0;
      stateRef.current.wrongConsecutive = 0;
      stateRef.current.lastStep = currentStep;
      stateRef.current.areaWindows.clear();
    }
  }, [currentStep]);

  // Timer-based deviation: if the step declares wrongTimeoutMs and we don't
  // advance in time, fire onDeviation once per step.
  useEffect(() => {
    const step = steps[currentStep];
    if (!step?.wrongTimeoutMs || !onDeviation) return;
    const timer = window.setTimeout(() => {
      if (stateRef.current.deviationFiredForStep !== currentStep) {
        stateRef.current.deviationFiredForStep = currentStep;
        onDeviation();
      }
    }, step.wrongTimeoutMs);
    return () => window.clearTimeout(timer);
  }, [steps, currentStep, onDeviation]);

  useEffect(() => {
    const unsubscribe = detectionService.subscribe((frame) => {
      const step = steps[currentStep];
      if (!step) return;

      if (step.kind === 'arrived') {
        if (!stateRef.current.arrivedFired) {
          stateRef.current.arrivedFired = true;
          onArrived();
        }
        return;
      }

      // Detection-based deviation: check current step's wrongTrigger.
      if (step.wrongTrigger && step.wrongTrigger.length > 0 && onDeviation) {
        const wrongSet = new Set<DetectionClass>(step.wrongTrigger);
        const wrongVisible = frame.detections.some(
          (d) => wrongSet.has(d.class) && d.confidence >= WRONG_MIN_CONFIDENCE,
        );
        if (wrongVisible) {
          stateRef.current.wrongConsecutive += 1;
          const minFrames = step.wrongMinFrames ?? 3;
          if (
            stateRef.current.wrongConsecutive >= minFrames &&
            stateRef.current.deviationFiredForStep !== currentStep
          ) {
            stateRef.current.deviationFiredForStep = currentStep;
            stateRef.current.wrongConsecutive = 0;
            onDeviation();
          }
        } else {
          stateRef.current.wrongConsecutive = 0;
        }
      }

      // Advance when next step's trigger conditions ALL hold for minFrames frames.
      const next = steps[currentStep + 1];
      if (!next || next.trigger.length === 0) return;

      const allHold = next.trigger.every((cond) =>
        matchesCondition(frame.detections, cond, next.minConfidence, stateRef.current),
      );

      if (allHold) {
        stateRef.current.consecutive += 1;
        if (stateRef.current.consecutive >= next.minFrames) {
          stateRef.current.consecutive = 0;
          onAdvance(currentStep + 1);
        }
      } else {
        stateRef.current.consecutive = 0;
      }
    });
    return unsubscribe;
  }, [steps, currentStep, onAdvance, onArrived, onDeviation]);
}
