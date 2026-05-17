import { useEffect, useRef } from 'react';
import { detectionService, type DetectionClass } from '../services/detectionService';

export interface NavigationStep {
  id: number;
  kind: 'qr' | 'ar' | 'arrived';
  trigger: DetectionClass[];
  arrow: 'straight' | 'left' | 'right';
  minConfidence: number;
  minFrames: number;
  /** YOLO classes that, when seen at this step, indicate wrong direction. */
  wrongTrigger?: DetectionClass[];
  /** Consecutive frames of wrongTrigger before deviation fires (default 3). */
  wrongMinFrames?: number;
  /** If set, fire deviation after this many ms of no advancement. */
  wrongTimeoutMs?: number;
}

interface AdvancerOptions {
  steps: NavigationStep[];
  currentStep: number;
  onAdvance: (nextStep: number) => void;
  onArrived: () => void;
  /** Called once per step when YOLO sees a wrongTrigger class or the
   *  step's wrongTimeoutMs elapses without advancing. */
  onDeviation?: () => void;
}

const WRONG_MIN_CONFIDENCE = 0.5;

/**
 * Subscribes to detectionService and advances to the NEXT step when any
 * class in that step's `trigger` array appears for `minFrames` consecutive
 * frames above `minConfidence`. Reaching a step with kind="arrived" fires
 * onArrived once.
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
  const stateRef = useRef({
    consecutive: 0,
    wrongConsecutive: 0,
    lastStep: -1,
    arrivedFired: false,
    deviationFiredForStep: -1,
  });

  useEffect(() => {
    if (stateRef.current.lastStep !== currentStep) {
      stateRef.current.consecutive = 0;
      stateRef.current.wrongConsecutive = 0;
      stateRef.current.lastStep = currentStep;
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

      // Advance when next step's trigger is seen for minFrames consecutive frames.
      const next = steps[currentStep + 1];
      if (!next || next.trigger.length === 0) return;

      const triggerSet = new Set<DetectionClass>(next.trigger);
      const triggerVisible = frame.detections.some(
        (d) => triggerSet.has(d.class) && d.confidence >= next.minConfidence,
      );

      if (triggerVisible) {
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
