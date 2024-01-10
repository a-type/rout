import { GameDefinition, GameRandom, Move } from '@long-game/game-definition';
import { lazy } from 'react';
import {
  CONNECTIONS,
  Coordinate,
  CoordinateKey,
  MERGES,
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

export type GridCell = {
  tile: TileShape;
  owner: string | null;
  id: string;
};

export type Grid = Record<CoordinateKey, GridCell[]>;

export type PlayerHand = {
  tiles: (GridCell | null)[];
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
export type MoveData = {
  tile: TileShape;
  // which tile id from your hand
  handId: string;
  // where it goes
  coordinate: Coordinate;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  MoveData
> = {
  version: `v1.0`,
  // run on both client and server

  validateTurn: ({ playerState, moves }) => {
    if (moves.length > 1) {
      return 'You can only make one move per turn.';
    }

    // verify all tiles used are in player's hand
    const move = moves[0];
    const isInHand = getTileInHand(playerState.hand, move.data.handId);
    if (!isInHand) {
      return `You don't have that tile in your hand.`;
    }

    // cannot move where tiles already are
    const key = toCoordinateKey(move.data.coordinate.x, move.data.coordinate.y);
    if (!!playerState.grid[key]?.length) {
      return 'There is already a tile there.';
    }

    // cannot move to positions with incompatible adjacents
    const adjacents = getAdjacents(move.data.coordinate);
    for (const adjacent of adjacents) {
      const adjacentKey = toCoordinateKey(adjacent.x, adjacent.y);
      const adjacentTiles = playerState.grid[adjacentKey];
      if (!adjacentTiles) {
        continue;
      }
      const adjacentTile = mergeTiles(adjacentTiles.map((t) => t.tile));
      if (
        !areTilesCompatible(
          move.data.tile,
          move.data.coordinate,
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
    prospectiveMoves: moves,
    playerId,
  }) => {
    // add tile to the board and remove from hand
    const move = moves[0];
    if (!move) {
      return playerState;
    }

    const cell = getTileInHand(playerState.hand, move.data.handId);

    if (!cell) {
      return playerState;
    }

    const grid = addTile(
      playerState.grid,
      move.data.coordinate,
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
            tile: random.item(SORTED_TILES),
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

  getPublicMove: ({ move, globalState }) => {
    return move;
  },

  getStatus: ({ globalState }) => {
    const isGameOver =
      Object.keys(globalState.grid).length === GRID_SIZE * GRID_SIZE;

    if (!isGameOver) {
      return {
        status: 'active',
      };
    }

    // winner has the most connections to other tiles
    const playerIds = Object.keys(globalState.playerHands);
    const playerScores = playerIds.reduce((scores, playerId) => {
      scores[playerId] = 0;
      return scores;
    }, {} as Record<string, number>);
    for (const [coordinateKey, cells] of Object.entries(globalState.grid)) {
      const coordinate = fromCoordinateKey(coordinateKey as CoordinateKey);
      for (const { tile, owner } of cells) {
        if (!owner) {
          continue;
        }
        const score = scoreTile(globalState.grid, coordinate, tile);
        playerScores[owner] += score;
      }
    }
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
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Move<MoveData>>,
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

  const moves = round.moves;
  // make copies of global state which we will update with
  // the moves from this round, validate, then apply
  let gridWithAllTilesApplied = { ...globalState.grid };

  for (const move of moves) {
    let cell: GridCell | null;
    if (move.userId) {
      cell =
        getTileInHand(globalState.playerHands[move.userId], move.data.handId) ??
        null;
    } else {
      cell = {
        tile: move.data.tile,
        owner: null,
        id: move.data.handId,
      };
    }

    // the player didn't actually have this tile in their hand?
    if (!cell) {
      continue;
    }

    gridWithAllTilesApplied = addTile(
      gridWithAllTilesApplied,
      move.data.coordinate,
      cell,
      move.userId,
    );

    // no user for this move - the only possible way this happens
    // right now is if a player is deleted from the whole system.
    // don't check their hand...
    if (!move.userId) {
      continue;
    }
  }

  // now all tiles have been played. we check each one for validity.
  // if it's not invalid, it's "returned to the player's hand" - i.e.
  // we don't remove it. If it is valid, we remove it and replace with
  // a random one.
  const finalGrid = { ...gridWithAllTilesApplied };
  const playerHandsWithNewTiles = { ...globalState.playerHands };
  for (const move of moves) {
    const coordinateKey = toCoordinateKey(
      move.data.coordinate.x,
      move.data.coordinate.y,
    );

    const adjacents = getAdjacentTiles(
      move.data.coordinate,
      gridWithAllTilesApplied,
    );
    const invalid = adjacents.some(([adjacentCoord, adjacentTile]) => {
      return !areTilesCompatible(
        move.data.tile,
        move.data.coordinate,
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
      // remove the invalid tile from the board
      finalGrid[coordinateKey] = finalGrid[coordinateKey]?.filter(
        (c) => c.id !== move.data.handId,
      );
    } else {
      if (!move.userId) {
        // no user for this move - the only possible way this happens
        // right now is if a player is deleted from the whole system.
        // don't check their hand...
        continue;
      } else {
        const playerHand = playerHandsWithNewTiles[move.userId];
        playerHandsWithNewTiles[move.userId] = {
          ...playerHand,
          tiles: playerHand.tiles.map((t) => {
            if (t?.id === move.data.handId) {
              return {
                tile: random.item(SORTED_TILES),
                id: random.id(),
                owner: move.userId,
              };
            }
            return t;
          }),
        };
      }
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
  tile: GridCell,
  owner: string | null,
) {
  const key = toCoordinateKey(coordinate.x, coordinate.y);
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
  const adjacentCoords = getAdjacents(coordinate);
  const adjacentTiles: { tile: TileShape; coordinate: Coordinate }[] =
    adjacentCoords.map((c) => ({
      tile: mergeTiles(
        grid[toCoordinateKey(c.x, c.y)]?.map((c) => c.tile) ?? [],
      ),
      coordinate: c,
    }));
  let score = 0;
  for (const {
    tile: adjacentTile,
    coordinate: adjacentCoordinate,
  } of adjacentTiles) {
    if (!areTilesCompatible(tile, coordinate, adjacentTile, coordinate)) {
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
    const key = toCoordinateKey(c.x, c.y);
    return [c, mergeTiles(grid[key]?.map((c) => c.tile) ?? [])] as const;
  });
}
