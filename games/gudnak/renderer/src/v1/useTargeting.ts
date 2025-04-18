import type {
  EffectTargetDefinition,
  Target,
} from '@long-game/game-gudnak-definition/v1';
import { useState } from 'react';

export function useTargeting() {
  const [queuedTargetInputs, setQueuedTargetInputs] = useState<
    EffectTargetDefinition[]
  >([]);
  const [chosenTargets, setChosenTargets] = useState<Target[]>([]);
  const nextTargetInput =
    queuedTargetInputs.length > 0 ? queuedTargetInputs[0] : null;
  const choosingTargets = !!nextTargetInput;

  const begin = (targetInputs: EffectTargetDefinition[]) => {
    setQueuedTargetInputs(targetInputs);
    setChosenTargets([]);
  };

  const select = (target: Target) => {
    setChosenTargets((prev) => [...prev, target]);
    setQueuedTargetInputs((prev) => prev.slice(1));
  };

  const clear = () => {
    setQueuedTargetInputs([]);
    setChosenTargets([]);
  };

  return {
    queued: queuedTargetInputs,
    chosen: chosenTargets,
    next: nextTargetInput,
    active: choosingTargets,
    begin,
    select,
    clear,
  };
}
