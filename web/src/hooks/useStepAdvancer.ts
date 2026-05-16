import { useEffect, useRef } from 'react';
import { detectionService, type DetectionClass } from '../services/detectionService';

export interface NavigationStep {
  id: number;
  kind: 'qr' | 'ar' | 'arrived';
  trigger: DetectionClass[];
  arrow: 'straight' | 'left' | 'right';
  minConfidence: number;
  minFrames: number;
}

interface AdvancerOptions {
  steps: NavigationStep[];
  currentStep: number;
  onAdvance: (nextStep: number) => void;
  onArrived: () => void;
}

/**
 * Subscribes to detectionService and advances to the NEXT step when any
 * class in that step's `trigger` array appears for `minFrames` consecutive
 * frames above `minConfidence`. Reaching a step with kind="arrived" fires
 * onArrived once.
 */
export function useStepAdvancer({
  steps,
  currentStep,
  onAdvance,
  onArrived,
}: AdvancerOptions): void {
  const stateRef = useRef({
    consecutive: 0,
    lastStep: -1,
    arrivedFired: false,
  });

  useEffect(() => {
    if (stateRef.current.lastStep !== currentStep) {
      stateRef.current.consecutive = 0;
      stateRef.current.lastStep = currentStep;
    }
  }, [currentStep]);

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
  }, [steps, currentStep, onAdvance, onArrived]);
}
