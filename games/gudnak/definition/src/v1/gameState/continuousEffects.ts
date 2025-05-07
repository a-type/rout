import type { GlobalState, ContinuousEffect } from '../gameDefinition';
import { updateCardState } from './card';

export function addContinuousEffectToCard(
  gameState: GlobalState,
  cardInstanceId: string,
  effect: ContinuousEffect,
): GlobalState {
  const continuousEffects = [
    ...gameState.cardState[cardInstanceId].continuousEffects,
    effect,
  ];
  return updateCardState(gameState, cardInstanceId, { continuousEffects });
}

export function removeTurnBasedContinuousEffects(
  gameState: GlobalState,
  nextTurnOwnerId: string,
): GlobalState {
  return {
    ...gameState,
    cardState: Object.fromEntries(
      Object.entries(gameState.cardState).map(([id, card]) => [
        id,
        {
          ...card,
          continuousEffects: card.continuousEffects?.filter((e) => {
            if (e.duration === 'end-of-turn') {
              return false;
            }
            if (e.duration === 'owners-next-turn') {
              return e.ownerId !== nextTurnOwnerId;
            }
            return true;
          }),
        },
      ]),
    ),
  };
}
