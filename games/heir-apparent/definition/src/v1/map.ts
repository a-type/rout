import { PrefixedId } from '@long-game/common';
import { GameRandom } from '@long-game/game-definition';
import {
  addCoordinates,
  collectTraversals,
  coord,
  deserializeCoordinate,
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
import { newFortressTile, newTerrainTile, TileData } from './tiles.js';

export function getMapSize(playerCount: number) {
  return playerCount * 10;
}

export function generateRandomMap(
  playerIds: PrefixedId<'u'>[],
  random: GameRandom,
) {
  const size = getMapSize(playerIds.length);
  // fill the map with plain to start
  const map: HexMap<TileData> = {};
  traverseMap(hexagonTraverser(hexLayout, size), (coord) =>
    setCell(map, coord, newTerrainTile('plain')),
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
          setCell(map, coord, newTerrainTile('deposit'));
        } else if (mountainIndices.includes(i)) {
          setCell(map, coord, newTerrainTile('mountain'));
        }
      },
    );
  }

  // at the end, clear out the safe areas and add a workshop
  // owned by the player
  for (const { safeArea, center, playerId } of startingAreas) {
    for (const coord of safeArea) {
      setCell(map, coord, newTerrainTile('plain'));
    }
    setCell(map, center, { ...newFortressTile('workshop'), playerId });
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
  map: HexMap<TileData>;
  piece: FortressPiece;
  origin: HexCoordinate;
  playerId: PrefixedId<'u'>;
}) {
  for (const [sCoord, tile] of Object.entries(piece.tiles)) {
    const tileCoord = deserializeCoordinate(sCoord);
    map[serializeCoordinate(addCoordinates(origin, tileCoord))] = {
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
  map: HexMap<TileData>;
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
