import type { GlobalState, ContinuousEffect } from '../gameDefinition';

export function addContinuousEffectToCard(
  gameState: GlobalState,
  cardInstanceId: string,
  effect: ContinuousEffect,
): GlobalState {
  return {
    ...gameState,
    cardState: {
      ...gameState.cardState,
      [cardInstanceId]: {
        ...gameState.cardState[cardInstanceId],
        continuousEffects: [
          ...gameState.cardState[cardInstanceId].continuousEffects,
          effect,
        ],
      },
    },
  };
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
