import { PrefixedId } from '@long-game/common';
import {
  BaseTurnError,
  GameRandom,
  simpleError,
} from '@long-game/game-definition';
import {
  addCoordinates,
  collectTraversals,
  coord,
  coordinateDistance,
  deserializeCoordinate,
  getCell,
  hasLineOfSight,
  hexagonTraverser,
  HexCoordinate,
  HexMap,
  rotateCoordinate,
  serializeCoordinate,
  setCell,
  traverseMap,
} from '@long-game/hex-map';
import { hexLayout } from './hex.js';
import { FortressPiece, PiecePlacement } from './pieces.js';
import {
  FortressTileData,
  newFortressTile,
  newTerrainTile,
  TerrainTileData,
  TerrainTileType,
} from './tiles.js';
import { createUnit, mineDeposit, UnitData, upgradeUnit } from './units.js';

export interface GameMapTileData {
  terrain: TerrainTileData;
  fortress: FortressTileData | null;
  units: UnitData[];
  /** True if this tile, as seen by the viewing player, is in FOW */
  fogOfWar?: boolean;
}

export type GameMap = HexMap<GameMapTileData>;

function newMapTile(terrainType: TerrainTileType, fortress?: FortressTileData) {
  return {
    terrain: newTerrainTile(terrainType),
    fortress: fortress || null,
    units: [],
  } as GameMapTileData;
}

export function getMapSize(playerCount: number) {
  return playerCount * 10;
}

export function generateRandomMap(
  playerIds: PrefixedId<'u'>[],
  random: GameRandom,
) {
  const size = getMapSize(playerIds.length);
  // fill the map with plain to start
  const map: GameMap = {};
  traverseMap(hexagonTraverser(hexLayout, size), (coord) =>
    setCell(map, coord, newMapTile('plain')),
  );

  const startingAreas = getStartingAreas(playerIds);

  // within a ring of radius 5 to each player, place 1 deposit and 2 mountains
  for (const { center } of startingAreas) {
    const depositIndex = random.int(0, 36);
    const mountainIndices = [random.int(0, 36), random.int(0, 36)];
    if (mountainIndices[0] === depositIndex) {
      mountainIndices[0]++;
    }
    if (mountainIndices[1] === mountainIndices[0]) {
      mountainIndices[1]++;
    }
    traverseMap(
      hexagonTraverser(
        {
          ...hexLayout,
          origin: center,
        },
        5,
      ),
      (coord, i) => {
        if (i === depositIndex) {
          setCell(map, coord, newMapTile('deposit'));
        } else if (mountainIndices.includes(i)) {
          setCell(map, coord, newMapTile('mountain'));
        }
      },
    );
  }

  // at the end, clear out the safe areas and add a workshop
  // owned by the player
  for (const { safeArea, center, playerId } of startingAreas) {
    for (const coord of safeArea) {
      setCell(map, coord, newMapTile('plain'));
    }
    setCell(
      map,
      center,
      newMapTile('plain', newFortressTile('workshop', playerId, 1)),
    );
  }

  return map;
}

export function getStartingAreas(playerIds: PrefixedId<'u'>[]) {
  const size = getMapSize(playerIds.length);
  // determine starting positions.
  // each player gets a radius of 4 tiles to work with.
  // their center position is 5 from the edge of the map
  const defaultStartingPosition = coord(0, size - 5);
  const rotation = playerIds.length / 6;
  // list of the starting 'safe areas' for each player
  const startingAreas = playerIds.map((playerId, i) => {
    const angle = rotation * i;
    const position = rotateCoordinate(defaultStartingPosition, angle);
    return {
      playerId,
      center: position,
      safeArea: collectTraversals(
        hexagonTraverser(
          {
            ...hexLayout,
            origin: position,
          },
          4,
        ),
      ),
    };
  });
  return startingAreas;
}

export function validatePlacement({
  map,
  piece,
  origin,
  playerId,
}: {
  map: GameMap;
  piece: FortressPiece;
  origin: HexCoordinate;
  playerId: PrefixedId<'u'>;
}): BaseTurnError | void {
  // 1. no existing tiles in the way, unless those tiles are destroyed
  // 2. no mountain terrain in the way
  // 3. all tiles are on the map
  // 4. no enemy units in the way

  for (const [sCoord, tile] of Object.entries(piece.tiles)) {
    const tileCoord = deserializeCoordinate(sCoord);
    const mapCell = map[serializeCoordinate(addCoordinates(origin, tileCoord))];
    if (!mapCell) {
      return simpleError('Piece extends beyond map boundaries');
    }
    if (mapCell.terrain.type === 'mountain') {
      return simpleError('Cannot place piece on mountain terrain');
    }
    if (
      mapCell.fortress &&
      mapCell.fortress.destroyedRoundIndex === undefined
    ) {
      return simpleError('Cannot place piece on existing fortress tiles');
    }
    const enemyUnit = mapCell.units.find(
      (u) => u.playerId !== playerId && u.diedRoundIndex === undefined,
    );
    if (enemyUnit) {
      return simpleError('Cannot place piece on enemy units');
    }
  }
}
/**
 * Assumes you have already validated the placement
 * is allowed.
 */
export function placeValidPiece({
  map,
  piece,
  origin,
  playerId,
}: {
  map: GameMap;
  piece: FortressPiece;
  origin: HexCoordinate;
  playerId: PrefixedId<'u'>;
}) {
  for (const [sCoord, tile] of Object.entries(piece.tiles)) {
    const tileCoord = deserializeCoordinate(sCoord);
    const mapCell = map[serializeCoordinate(addCoordinates(origin, tileCoord))];
    mapCell.fortress = {
      ...tile,
      playerId,
    };
  }
  return map;
}

// wraps placeValidPiece for convenience
export function applyValidPlacement({
  map,
  placement,
  options,
  playerId,
}: {
  map: GameMap;
  placement: PiecePlacement;
  options: FortressPiece[];
  playerId: PrefixedId<'u'>;
}) {
  const piece = options.find((opt) => opt.id === placement.pieceId);
  if (!piece) {
    throw new Error(
      `Piece not found: ${placement.pieceId} (turn was not properly validated!)`,
    );
  }
  placeValidPiece({
    map,
    piece,
    origin: placement.origin,
    playerId,
  });
}

export function applyCellEffect({
  cell,
  random,
  progress,
}: {
  cell: GameMapTileData;
  random: GameRandom;
  progress: Record<PrefixedId<'u'>, number>;
}) {
  // fortress effects override underlying terrain
  if (cell.fortress) {
    const friendlyUnit = cell.units.find(
      (u) =>
        u.playerId === cell.fortress?.playerId &&
        u.diedRoundIndex === undefined,
    );
    if (cell.fortress.buildProgress < 1) {
      if (friendlyUnit) {
        // build the tile. right now this is instant.
        cell.fortress.buildProgress = 1;
      }
    } else {
      switch (cell.fortress.type) {
        case 'lodging':
          // spawn is blocked if any unit is present
          if (
            cell.units.filter((u) => u.diedRoundIndex !== undefined).length ===
            0
          ) {
            // spawn infantry
            cell.units.push(
              createUnit(cell.fortress.playerId, 'infantry', random),
            );
          } else if (friendlyUnit) {
            // upgrade the unit
            upgradeUnit(friendlyUnit);
          }
          break;
        case 'workshop':
          if (friendlyUnit) {
            progress[cell.fortress.playerId] += 0.2;
          }
          break;
      }
    }
  } else {
    switch (cell.terrain.type) {
      case 'deposit':
        cell.units.forEach(mineDeposit);
        break;
    }
  }
}

export function applyFogOfWar({
  map,
  playerId,
}: {
  map: GameMap;
  playerId: PrefixedId<'u'>;
}) {
  // FOW rules:
  // 1. friendly fortress tiles can always see everything within 4 spaces
  // 2. any fortress tile can be seen from 4 spaces away by a unit
  // 3. units see other units within 2 spaces
  // 4. units besides cavalry in overgrowth are hidden from enemy units and fortresses, unless a friendly unit is on the same tile,
  //    or any fortress is built on that tile
  // 5. Players cannot see across mountains
  // 6. Players cannot see across enemy fortress tiles

  // iterate over the map, evaluate rules, and set fortress to null or remove enemy units
  // based on visibility
  let fortressVisible = false;
  let enemyUnitsVisible = false;
  for (const [serializedCoordinate, cell] of Object.entries(map)) {
    const coordinate = deserializeCoordinate(serializedCoordinate);
    // all rules can be evaluated by checking a 4-radius ring around each cell
    traverseMap(
      hexagonTraverser(
        {
          ...hexLayout,
          origin: coordinate,
        },
        4,
      ),
      (neighborCoord) => {
        const neighborCell = getCell(map, neighborCoord);
        if (!neighborCell) {
          return;
        }
        // check that line of sight is available to the checked cell
        if (
          !hasLineOfSight(neighborCoord, coordinate, (visited) => {
            const visitedCell = getCell(map, visited);
            return !!(
              visitedCell?.terrain.type === 'mountain' ||
              (visitedCell?.fortress &&
                visitedCell.fortress.playerId !== playerId)
            );
          })
        ) {
          return;
        }
        const distance = coordinateDistance(coordinate, neighborCoord);
        const hasFriendlyUnit = neighborCell.units.some(
          (u) => u.playerId === playerId && u.diedRoundIndex === undefined,
        );
        if (neighborCell.fortress?.playerId === playerId || hasFriendlyUnit) {
          fortressVisible = true;
          enemyUnitsVisible = true;
        }
        if (distance <= 2 && hasFriendlyUnit) {
          enemyUnitsVisible = true;
        }
      },
    );
    // reassert invisibility of units in overgrowth
    if (cell.terrain.type === 'overgrowth') {
      const friendlyUnitOnTile =
        cell.units.some(
          (u) => u.playerId === playerId && u.diedRoundIndex === undefined,
        ) || !!cell.fortress;
      if (!friendlyUnitOnTile) {
        enemyUnitsVisible = false;
      }
    }

    if (!fortressVisible) {
      cell.fortress = null;
      cell.fogOfWar = true;
    }
    if (!enemyUnitsVisible) {
      cell.units = cell.units.filter((u) => u.playerId === playerId);
      cell.fogOfWar = true;
    }
  }
}
