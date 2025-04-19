import type { Action, FreeAction, GlobalState } from '../gameDefinition';

export function findMatchingFreeAction(
  action: Action,
  freeActions: FreeAction[],
): FreeAction | null {
  const freeAction = freeActions.find((a) => {
    if (action.type !== a.type) {
      return false;
    }
    if (!a.cardInstanceId) {
      return true;
    }
    if (action.type === 'deploy') {
      return a.cardInstanceId === action.card.instanceId;
    }
    if (action.type === 'move') {
      return a.cardInstanceId === action.cardInstanceId;
    }
  });
  return freeAction ?? null;
}

export function spendFreeAction(gameState: GlobalState, action: FreeAction) {
  const freeActions = gameState.freeActions
    .map((a) => {
      if (a !== action) {
        return a;
      }
      if (a.count && a.count > 1) {
        return { ...a, count: a.count - 1 };
      }
      return null;
    })
    .filter(Boolean) as FreeAction[];
  return {
    ...gameState,
    freeActions,
  };
}
