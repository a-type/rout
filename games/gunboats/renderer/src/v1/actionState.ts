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
  target: null as Position | null,
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

export type ShipFire = {
  type: 'shipFire';
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

export function useActionState() {
  return useSnapshot(actionState);
}

export function getActionTaken(): ActionTaken {
  if (!actionState.action) {
    throw new Error('No active action');
  }
  switch (actionState.action.type) {
    case 'ship':
      assert(!!actionState.position, 'Position must be set for ship action');
      return {
        type: 'ship',
        id: actionState.action.id,
        position: actionState.position,
        orientation: actionState.orientation,
      };
    case 'move':
      assert(!!actionState.shipId, 'Ship ID must be set for move action');
      return {
        type: 'move',
        id: actionState.action.id,
        shipId: actionState.shipId,
        orientation: actionState.orientation,
        distance: actionState.distance,
      };
    case 'fire':
      assert(!!actionState.target, 'Target must be set for fire action');
      assert(!!actionState.shipId, 'Ship ID must be set for fire action');
      return {
        type: 'fire',
        id: actionState.action.id,
        shipId: actionState.shipId,
        target: actionState.target,
      };
    default:
      throw new Error(
        `Unknown action type: ${(actionState.action as any).type}`,
      );
  }
}

export function resetActionState() {
  actionState.action = null;
  actionState.position = null;
  actionState.orientation = 0;
  actionState.target = null;
  actionState.distance = 0;
  actionState.shipId = null;
}
