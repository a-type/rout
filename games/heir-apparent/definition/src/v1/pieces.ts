import { GameRandom } from '@long-game/game-definition';
import {
  collectTraversals,
  HexCoordinate,
  HexMap,
  lineTraverser,
  rectangleTraverser,
  serializeCoordinate,
  subtractCoordinates,
  triangleTraverser,
} from '@long-game/hex-map';
import { hexLayout } from './hex.js';
import {
  FortressTileData,
  newFortressTile,
  weightedFortressTileTypes,
} from './tiles.js';

// note: try to make sure these are balanced around 0,0 as the center
const pieceShapes: HexCoordinate[][] = [
  // square
  collectTraversals(rectangleTraverser(hexLayout, 2, 2)).map((c) =>
    subtractCoordinates(c, [0, 1]),
  ),
  // triangle
  collectTraversals(triangleTraverser(hexLayout, 2, 0)),
  // lines
  collectTraversals(lineTraverser([0, 0], [1, 0])),
  collectTraversals(lineTraverser([-1, 0], [1, 0])),
  // boomerangish shape
  [
    // line 2 to the right
    ...collectTraversals(lineTraverser([-1, 0], [0, 0])),
    // one below the end
    [0, 1],
  ],
];

export type FortressPiece = {
  id: string;
  tiles: HexMap<Omit<FortressTileData, 'playerId'>>;
};

function randomType(random: GameRandom) {
  return random.item(weightedFortressTileTypes);
}

export function generatePieceOptions(
  random: GameRandom,
  round: number,
): FortressPiece[] {
  return [
    // always include a single hex. on round 0 it's a lodging.
    {
      id: random.id(),
      tiles: {
        [serializeCoordinate([0, 0])]: newFortressTile(
          round === 0 ? 'lodging' : randomType(random),
        ),
      },
    },
    // 2 more random pieces
    randomPiece(random),
    randomPiece(random),
  ];
}

function randomPiece(random: GameRandom): FortressPiece {
  return {
    id: random.id(),
    tiles: Object.fromEntries(
      random
        .item(pieceShapes)
        .map((coord) => [
          serializeCoordinate(coord),
          newFortressTile(randomType(random)),
        ]),
    ),
  };
}
