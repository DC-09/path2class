import { useEffect, useRef } from 'react';
import { detectionService, type DetectionClass } from '../services/detectionService';

export interface NavigationStep {
  id: number;
  arrow: 'straight' | 'left' | 'right';
  advanceOn: DetectionClass | null;
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
 * Subscribes to detectionService and advances the navigation step when the
 * current step's trigger class is detected for `minFrames` consecutive
 * frames above `minConfidence`. The terminal step (advanceOn === null)
 * fires onArrived once.
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

      if (step.advanceOn === null) {
        if (!stateRef.current.arrivedFired) {
          stateRef.current.arrivedFired = true;
          onArrived();
        }
        return;
      }

      const triggerVisible = frame.detections.some(
        (d) => d.class === step.advanceOn && d.confidence >= step.minConfidence,
      );

      if (triggerVisible) {
        stateRef.current.consecutive += 1;
        if (stateRef.current.consecutive >= step.minFrames) {
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
