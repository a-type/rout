import { assert } from '@long-game/common';
import {
  Action,
  ActionTaken,
  Orientation,
  placeShip,
  Position,
} from '@long-game/game-gunboats-definition/v1';
import { proxy, subscribe, useSnapshot } from 'valtio';

export const actionState = proxy({
  action: null as Action | null,
  position: null as Position | null,
  orientation: 0 as Orientation,
  distance: 0,
  shipId: null as string | null,
});

subscribe(actionState, () => {
  console.log('Action state changed:', actionState);
});

export type ShipMove = {
  type: 'shipMove';
  shipId: string;
};

export function usePlacingShipParts() {
  const { action, position, orientation } = useSnapshot(actionState);
  if (!action || action.type !== 'ship' || !position) {
    return [];
  }
  return placeShip({
    shipLength: action.shipLength,
    position,
    orientation,
  });
}

export function useActiveAction() {
  const { action } = useSnapshot(actionState);
  return action;
}

export function useActiveActionShipTarget() {
  return useSnapshot(actionState).shipId;
}

export function useActiveActionPosition() {
  return useSnapshot(actionState).position;
}

export function useFiringOnLocation() {
  const { position, action } = useSnapshot(actionState);
  if (action?.type !== 'fire') {
    return null;
  }
  return position;
}

export function useActionState() {
  return useSnapshot(actionState);
}

export function getActionTaken(state = actionState): ActionTaken {
  if (!state.action) {
    throw new Error('No active action');
  }
  switch (state.action.type) {
    case 'ship':
      assert(!!state.position, 'Position must be set for ship action');
      return {
        type: 'ship',
        id: state.action.id,
        position: state.position,
        orientation: state.orientation,
      };
    case 'move':
      assert(!!state.shipId, 'Ship ID must be set for move action');
      return {
        type: 'move',
        id: state.action.id,
        shipId: state.shipId,
        orientation: state.orientation,
        distance: state.distance,
      };
    case 'fire':
      assert(!!state.position, 'Target must be set for fire action');
      return {
        type: 'fire',
        id: state.action.id,
        target: state.position,
      };
    default:
      throw new Error(`Unknown action type: ${(state.action as any).type}`);
  }
}

export function useActionTaken() {
  const snap = useSnapshot(actionState);
  return snap.action ? getActionTaken(snap) : null;
}

export function resetActionState() {
  actionState.action = null;
  actionState.position = null;
  actionState.orientation = 0;
  actionState.distance = 0;
  actionState.shipId = null;
}
