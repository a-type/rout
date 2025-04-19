import type {
  EffectTargetDefinition,
  Target,
} from '@long-game/game-gudnak-definition/v1';
import { useEffect, useRef, useState } from 'react';

export function useTargeting() {
  const [queuedTargetInputs, setQueuedTargetInputs] = useState<
    EffectTargetDefinition[]
  >([]);
  const [chosenTargets, setChosenTargets] = useState<Target[]>([]);
  const onTargetsCompleteRef = useRef<(targets: Target[]) => void>(null);
  const nextTargetInput =
    queuedTargetInputs.length > 0 ? queuedTargetInputs[0] : null;
  const choosingTargets = !!nextTargetInput;

  const begin = (targetInputs: EffectTargetDefinition[]) => {
    clear();
    setQueuedTargetInputs(targetInputs);
    setChosenTargets([]);
  };

  const select = (target: Target) => {
    console.log('select', target);
    setChosenTargets((prev) => [...prev, target]);
    setQueuedTargetInputs((prev) => prev.slice(1));
  };

  const clear = () => {
    onTargetsCompleteRef.current = null;
    setQueuedTargetInputs([]);
    setChosenTargets([]);
  };

  const setOnTargetsComplete = (fn: (targets: Target[]) => void) => {
    onTargetsCompleteRef.current = fn;
  };

  useEffect(() => {
    if (!choosingTargets && onTargetsCompleteRef.current) {
      onTargetsCompleteRef.current(chosenTargets);
      clear();
    }
  }, [choosingTargets, chosenTargets]);

  return {
    queued: queuedTargetInputs,
    chosen: chosenTargets,
    next: nextTargetInput,
    active: choosingTargets,
    begin,
    select,
    clear,
    onTargetsComplete: setOnTargetsComplete,
  };
}
