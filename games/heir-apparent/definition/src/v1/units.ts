import { PrefixedId } from '@long-game/common';
import { GameRandom } from '@long-game/game-definition';
import { getCell, HexCoordinate, mapIterator } from '@long-game/hex-map';
import { TurnError } from './gameDefinition.js';
import { GameMap } from './map.js';

export type UnitData = {
  id: string;
  type: 'infantry' | 'archer' | 'cavalry';
  health: number;
  // may seem redundant with health, but this doesn't get toggled
  // until the end of the round; so if multiple players attack a unit
  // their attacks are all applied. otherwise the attack might be divided
  // differently after a unit is killed while attacks are being resolved
  diedRoundIndex?: number;
  playerId: PrefixedId<'u'>;
  carryingGold: number;
};

export function isUnitData(data: unknown): data is UnitData {
  const unit = data as UnitData;
  return (
    typeof unit.id === 'string' &&
    typeof unit.type === 'string' &&
    ['infantry', 'archer', 'cavalry'].includes(unit.type) &&
    typeof unit.health === 'number' &&
    (unit.diedRoundIndex === undefined ||
      typeof unit.diedRoundIndex === 'number') &&
    typeof unit.playerId === 'string'
  );
}

export type UnitType = UnitData['type'];

export const baseUnitDamage: Record<UnitType, number> = {
  infantry: 2,
  archer: 1,
  cavalry: 4,
};

export const unitHealth: Record<UnitType, number> = {
  infantry: 12,
  archer: 10,
  cavalry: 16,
};

export const unitCarryingCapacity: Record<UnitType, number> = {
  infantry: 5,
  archer: 2,
  cavalry: 3,
};

export interface UnitAction {
  action: 'move' | 'attack';
  target: HexCoordinate;
}

export function findUnit(map: GameMap, unitId: string) {
  for (const [position, tile] of mapIterator(map)) {
    const unit = tile.units.find((u) => u.id === unitId);
    if (unit) {
      return { unit, position, tile };
    }
  }
  return null;
}

export function unitError(message: string, unitId: string) {
  return {
    code: 'unit-error' as const,
    message,
    data: { unitId },
  };
}

export function createUnit(
  playerId: PrefixedId<'u'>,
  type: UnitType,
  random: GameRandom,
) {
  return {
    playerId,
    type,
    health: unitHealth[type],
    id: random.id(),
    carryingGold: 0,
  } satisfies UnitData;
}

export function upgradeUnit(unit: UnitData) {
  if (unit.diedRoundIndex !== undefined || unit.health <= 0) return unit;

  switch (unit.type) {
    case 'infantry':
      unit.type = 'archer';
      unit.health = unitHealth.archer;
      return unit;
    case 'archer':
      unit.type = 'cavalry';
      unit.health = unitHealth.cavalry;
      return unit;
    case 'cavalry':
      unit.health = unitHealth.cavalry;
      return unit;
  }
}

export function mineDeposit(unit: UnitData) {
  if (unit.diedRoundIndex !== undefined || unit.health <= 0) return 0;
  const capacity = unitCarryingCapacity[unit.type];
  const amount = Math.min(capacity - unit.carryingGold, 1);
  unit.carryingGold += amount;
  return amount;
}

export function validateUnitAction({
  unit,
  position,
  action,
  tiles,
}: {
  unit: UnitData;
  position: HexCoordinate;
  action: UnitAction;
  tiles: GameMap;
}): TurnError | void {
  if (unit.diedRoundIndex !== undefined) {
    return unitError(`Unit is dead and cannot act`, unit.id);
  }
  if (action.action === 'move') {
    const targetTile = getCell(tiles, action.target);
    if (!targetTile) {
      return unitError(`Target tile ${action.target} does not exist`, unit.id);
    }
    if (targetTile.units.some((u) => u.playerId === unit.playerId)) {
      return unitError(
        `Cannot move to a tile occupied by your own units`,
        unit.id,
      );
    }
    // TODO: movement range
  } else if (action.action === 'attack') {
    const targetTile = getCell(tiles, action.target);
    if (!targetTile) {
      return unitError(`Target tile ${action.target} does not exist`, unit.id);
    }
    // TODO: attack range
  } else {
    return unitError(`Unknown action type: ${action.action}`, unit.id);
  }
}

/**
 * Applies an action on the board.
 * Assumes the action has already been validated!
 */
export function applyUnitAction({
  unit,
  position,
  action,
  tiles,
}: {
  unit: UnitData;
  position: HexCoordinate;
  action: UnitAction;
  tiles: GameMap;
}) {
  const fromTile = getCell(tiles, position)!;
  const toTile = getCell(tiles, action.target)!;
  if (action.action === 'move') {
    fromTile.units = fromTile.units.filter((u) => u !== unit);
    toTile.units.push(unit);
  } else if (action.action === 'attack') {
    const isOnFriendlyBallista =
      fromTile.fortress?.type === 'ballista' &&
      fromTile.fortress.playerId === unit.playerId;
    const damage = isOnFriendlyBallista ? 8 : baseUnitDamage[unit.type];
    const targetUnits = toTile.units.filter(
      (u) => u.playerId !== unit.playerId,
    );
    const targetFortress =
      toTile.fortress?.playerId !== unit.playerId ? toTile.fortress : null;
    const totalTargets = targetUnits.length + (targetFortress ? 1 : 0);
    const damagePer = Math.floor(damage / totalTargets);
    targetUnits.forEach((u) => {
      u.health -= damagePer;
      if (u.health <= 0) {
        u.health = 0;
      }
    });
    if (toTile.fortress && toTile.fortress.playerId !== unit.playerId) {
      toTile.fortress.health -= damagePer;
      if (toTile.fortress.health <= 0) {
        toTile.fortress.health = 0;
      }
    }
  }
}
