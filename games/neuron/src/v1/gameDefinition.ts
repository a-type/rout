import {
  GameDefinition,
  GameRandom,
  LocalTurn,
  Turn,
  roundFormat,
} from '@long-game/game-definition';
import { lazy } from 'react';
import {
  CONNECTIONS,
  Coordinate,
  CoordinateKey,
  SORTED_TILES,
  TileShape,
  areTilesCompatible,
  fromCoordinateKey,
  getAdjacencyDirection,
  mergeTiles,
  toCoordinateKey,
} from './tiles.js';
import { GameRound } from '@long-game/common';

export const GRID_SIZE = 9;
const HAND_SIZE = 5;

export type GridTile = {
  shape: TileShape;
  owner: string;
  id: string;
};

export type Grid = Record<CoordinateKey, GridTile[]>;

export type PlayerHand = {
  tiles: (GridTile | null)[];
};

export type GlobalState = {
  grid: Grid;
  playerHands: Record<string, PlayerHand>;
};

export type PlayerState = {
  grid: Grid;
  hand: PlayerHand;
};

// players position their letters on the board, one
// per cell.
export type MoveData =
  | {
      tile: TileShape;
      // which tile id from your hand
      tileId: string;
      // where it goes
      coordinate: Coordinate;
    }
  | { skip: true };

export function isSkip(move: MoveData): move is { skip: true } {
  return 'skip' in move;
}

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  MoveData
> = {
  version: `v1.0`,
  // run on both client and server
  validateTurn: ({ playerState, turn }) => {
    if (isSkip(turn.data)) return;
    // verify all tiles used are in player's hand
    const isInHand = getTileInHand(playerState.hand, turn.data.tileId);
    if (!isInHand) {
      return `You don't have that tile in your hand.`;
    }

    // cannot move where tiles already are
    const key = toCoordinateKey(turn.data.coordinate);
    if (!!playerState.grid[key]?.length) {
      return 'There is already a tile there.';
    }

    // cannot move to positions with incompatible adjacents
    const adjacents = getAdjacents(turn.data.coordinate);
    for (const adjacent of adjacents) {
      const adjacentKey = toCoordinateKey(adjacent);
      const adjacentTiles = playerState.grid[adjacentKey];
      if (!adjacentTiles) {
        continue;
      }
      const adjacentTile = mergeTiles(adjacentTiles.map((t) => t.shape));
      if (
        adjacentTile &&
        !areTilesCompatible(
          turn.data.tile,
          turn.data.coordinate,
          adjacentTile,
          adjacent,
        )
      ) {
        return 'That tile does not fit there.';
      }
    }
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client
  getProspectivePlayerState: ({
    playerState,
    prospectiveTurn: turn,
    playerId,
  }) => {
    if (isSkip(turn.data)) {
      return playerState;
    }

    // add tile to the board and remove from hand
    const cell = getTileInHand(playerState.hand, turn.data.tileId);

    if (!cell) {
      return playerState;
    }

    const grid = addTile(
      playerState.grid,
      turn.data.coordinate,
      cell,
      playerId,
    );
    return {
      grid,
      hand: {
        ...playerState.hand,
        tiles: playerState.hand.tiles.map((t) => {
          if (t?.id === cell.id) {
            return null;
          }
          return t;
        }),
      },
    };
  },

  // run on server
  getInitialGlobalState: ({ playerIds, random }) => {
    return {
      grid: {},
      playerHands: playerIds.reduce((hands, playerId) => {
        hands[playerId] = {
          tiles: new Array(HAND_SIZE).fill(null).map(() => ({
            shape: random.item(SORTED_TILES),
            id: random.id(),
            owner: playerId,
          })),
        };
        return hands;
      }, {} as Record<string, PlayerHand>),
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      grid: globalState.grid,
      hand: globalState.playerHands[playerId],
    };
  },

  getState: ({ initialState, rounds, random }) => {
    return rounds.reduce(
      (cur, round) => applyRoundToGlobalState(cur, round, random),
      // JSON.parse(JSON.stringify(initialState)),
      initialState,
    );
  },

  getPublicTurn: ({ turn, globalState }) => {
    return turn;
  },

  getStatus: ({ globalState }) => {
    const isBoardComplete =
      Object.keys(globalState.grid).length === GRID_SIZE * GRID_SIZE;

    if (!isBoardComplete) {
      // if there are no tiles left in any player's hand which
      // can be played, the game is over.
      const playerIds = Object.keys(globalState.playerHands);
      const playerHands = playerIds.map((id) => globalState.playerHands[id]);
      const tilesInHands = playerHands
        .map((hand) => hand.tiles)
        .flat()
        .filter((t) => !!t) as GridTile[];
      const tilesInHandsThatCanBePlayed = tilesInHands.filter((tile) =>
        canTileBePlayed(tile.shape, globalState.grid),
      );

      if (tilesInHandsThatCanBePlayed.length > 0) {
        return {
          status: 'active',
        };
      }
    }

    // winner has the most connections to other tiles
    const playerScores = getPlayerScores(globalState);
    const playersSortedByScore = Object.entries(playerScores).sort(
      (a, b) => b[1] - a[1],
    );

    let winnerIds: string[] = [];
    // messy but works, I think
    let i = 0;
    while (
      i < playersSortedByScore.length &&
      playersSortedByScore[i][1] === playersSortedByScore[0][1]
    ) {
      winnerIds.push(playersSortedByScore[i][0]);
      i++;
    }

    return {
      status: 'completed',
      winnerIds,
    };
  },

  getRoundIndex: roundFormat.sync(),
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Turn<MoveData>>,
  random: GameRandom,
) => {
  // what we already validated in the moves:
  // - only one move per player
  // - cannot move where another tile already was from a previous round
  // - tile exists in player's hand
  // - tile is compatible with adjacent tiles from previous rounds

  // now we need to apply the moves from all players and decide
  // which tile placements are valid when all player placements
  // have been resolved.

  const turns = round.turns;
  // make copies of global state which we will update with
  // the turns from this round, validate, then apply
  let gridWithAllTilesApplied = { ...globalState.grid };

  for (const turn of turns) {
    if (isSkip(turn.data)) {
      continue;
    }

    let cell: GridTile | null;
    if (turn.userId) {
      cell =
        getTileInHand(globalState.playerHands[turn.userId], turn.data.tileId) ??
        null;
    } else {
      cell = {
        shape: turn.data.tile,
        owner: 'system',
        id: turn.data.tileId,
      };
    }

    // the player didn't actually have this tile in their hand?
    if (!cell) {
      continue;
    }

    gridWithAllTilesApplied = addTile(
      gridWithAllTilesApplied,
      turn.data.coordinate,
      cell,
      turn.userId,
    );

    // no user for this move - the only possible way this happens
    // right now is if a player is deleted from the whole system.
    // don't check their hand...
    if (!turn.userId) {
      continue;
    }
  }

  // now all tiles have been played. we check each one for validity.
  // if it's not invalid, it's "returned to the player's hand" - i.e.
  // we don't remove it. If it is valid, we remove it and replace with
  // a random one.
  const finalGrid = { ...gridWithAllTilesApplied };
  const playerHandsWithNewTiles = { ...globalState.playerHands };
  for (const turn of turns) {
    const turnData = turn.data;
    if (isSkip(turnData)) {
      continue;
    }

    const coordinateKey = toCoordinateKey(turnData.coordinate);

    const adjacents = getAdjacentTiles(
      turnData.coordinate,
      gridWithAllTilesApplied,
    );
    const invalid = adjacents.some(([adjacentCoord, adjacentTile]) => {
      // empty adjacent cell is always valid
      if (!adjacentTile) {
        return false;
      }
      return !areTilesCompatible(
        turnData.tile,
        turnData.coordinate,
        adjacentTile,
        adjacentCoord,
      );
    });

    // FIXME: this validity check is only first-order. what if removing
    // a tile which was invalid for some other reason (a different neighbor)
    // makes our tile valid? after reach removed invalid tile, we should
    // re-check all adjacent tiles to see if they are now valid and should be restored
    // if they were already removed.
    if (invalid) {
      console.log('INVALID MOVE', turn, JSON.stringify(adjacents));
      // remove the invalid tile from the board
      finalGrid[coordinateKey] = finalGrid[coordinateKey]?.filter(
        (c) => c.id !== turnData.tileId,
      );
    } else {
      if (!turn.userId) {
        // no user for this move - the only possible way this happens
        // right now is if a player is deleted from the whole system.
        // FIXME: this actually breaks deterministic randomness!
        // this whole deletion thing might not work.
        continue;
      } else {
        const playerHand = playerHandsWithNewTiles[turn.userId];
        playerHandsWithNewTiles[turn.userId] = {
          ...playerHand,
          tiles: playerHand.tiles.map((t) => {
            if (t?.id === turnData.tileId) {
              return {
                shape: random.item(SORTED_TILES),
                id: random.id(),
                owner: turn.userId || 'system',
              };
            }
            return t;
          }),
        };
      }
    }
  }

  // remove any empty grid cells
  for (const [key, cells] of Object.entries(finalGrid)) {
    if (!cells.length) {
      delete finalGrid[key as CoordinateKey];
    }
  }

  return {
    ...globalState,
    grid: finalGrid,
    playerHands: playerHandsWithNewTiles,
  };
};

function addTile(
  grid: Grid,
  coordinate: Coordinate,
  tile: GridTile,
  owner: string | null,
) {
  const key = toCoordinateKey(coordinate);
  grid[key] = grid[key] || [];
  grid[key].push(tile);
  return grid;
}

function getTileInHand(hand: PlayerHand, tileId: string) {
  return hand.tiles.find((tile) => tile?.id === tileId);
}

function getAdjacents(coordinate: Coordinate) {
  const adjacents: Coordinate[] = [];
  if (coordinate.x > 0) {
    adjacents.push({ x: coordinate.x - 1, y: coordinate.y });
  }
  if (coordinate.y > 0) {
    adjacents.push({ x: coordinate.x, y: coordinate.y - 1 });
  }
  if (coordinate.x < GRID_SIZE - 1) {
    adjacents.push({ x: coordinate.x + 1, y: coordinate.y });
  }
  if (coordinate.y < GRID_SIZE - 1) {
    adjacents.push({ x: coordinate.x, y: coordinate.y + 1 });
  }
  return adjacents;
}

function scoreTile(grid: Grid, coordinate: Coordinate, tile: TileShape) {
  // special case, '·' tiles never score as they have no connections
  if (tile === '·') {
    return 0;
  }

  const tileConnections = CONNECTIONS[tile];
  const adjacents = getAdjacentTiles(coordinate, grid);
  let score = 0;
  for (const [adjacentCoordinate, adjacentTile] of adjacents) {
    if (
      !adjacentTile ||
      !areTilesCompatible(tile, coordinate, adjacentTile, adjacentCoordinate)
    ) {
      continue;
    }
    const direction = getAdjacencyDirection(coordinate, adjacentCoordinate);
    // if tile has a connection to this adjacent tile, add 1 to score
    if (tileConnections[direction]) {
      score++;
    }
  }
  return score;
}

/** Returns adjacent tiles as [coord,tile] tuples */
function getAdjacentTiles(coordinate: Coordinate, grid: Grid) {
  const adjacents = getAdjacents(coordinate);
  return adjacents.map((c) => {
    const key = toCoordinateKey(c);
    return [c, mergeTiles(grid[key]?.map((c) => c.shape) ?? [])] as const;
  });
}

/**
 * Determines if a tile shape can be played in any
 * remaining empty position on the board.
 */
export function canTileBePlayed(tile: TileShape, grid: Grid) {
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const coordinate = { x, y };
      const key = toCoordinateKey(coordinate);
      if (grid[key]?.length) {
        continue;
      }
      const adjacents = getAdjacentTiles(coordinate, grid);
      if (
        adjacents.every(
          ([adjacentCoordinate, adjacentTile]) =>
            !adjacentTile ||
            areTilesCompatible(
              tile,
              coordinate,
              adjacentTile,
              adjacentCoordinate,
            ),
        )
      ) {
        return coordinate;
      }
    }
  }
  return false;
}

export function getPlayerScores(globalState: GlobalState) {
  const playerIds = Object.keys(globalState.playerHands);
  const playerScores = playerIds.reduce((scores, playerId) => {
    scores[playerId] = 0;
    return scores;
  }, {} as Record<string, number>);
  for (const [coordinateKey, cells] of Object.entries(globalState.grid)) {
    const coordinate = fromCoordinateKey(coordinateKey as CoordinateKey);
    for (const { shape: tile, owner } of cells) {
      if (!owner) {
        continue;
      }
      const score = scoreTile(globalState.grid, coordinate, tile);
      playerScores[owner] += score;
    }
  }
  return playerScores;
}
