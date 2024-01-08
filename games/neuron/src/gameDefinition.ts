import { GameDefinition, GameRandom, Move } from '@long-game/game-definition';
import { lazy } from 'react';
import {
  CONNECTIONS,
  Coordinate,
  MERGES,
  SORTED_TILES,
  Tile,
  areTilesCompatible,
  getAdjacencyDirection,
} from './tiles.js';

const GRID_SIZE = 9;
const HAND_SIZE = 5;

export type GridCell = {
  tile: Tile;
  owner: string | null;
};

export type Grid = Record<CoordinateKey, GridCell[]>;

export type PlayerHand = {
  tiles: (Tile | null)[];
};

export type CoordinateKey = `${number},${number}`;

export type GlobalState = {
  grid: Grid;
  playerHands: Record<string, PlayerHand>;
};

export type PlayerState = {
  grid: Grid;
  hand: PlayerHand;
};

export type MoveData = {
  // players position their letters on the board, one
  // per cell.
  tile: Tile;
  coordinate: Coordinate;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  MoveData
> = {
  id: 'neuron',
  title: 'neuron',

  // run on both client and server

  validateTurn: ({ playerState, moves }) => {
    if (moves.length > 1) {
      return 'You can only make one move per turn.';
    }

    // verify all tiles used are in player's hand
    const move = moves[0];
    const tilesInHandWithCounts = countTiles(playerState.hand.tiles);
    if (!tilesInHandWithCounts[move.data.tile]) {
      return `You don't have that tile in your hand.`;
    }
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveMoves: moves }) => {
    const playerId = moves[0].userId;
    // add tile to the board and remove from hand
    const move = moves[0];
    const grid = addTile(
      playerState.grid,
      move.data.coordinate,
      move.data.tile,
      playerId,
    );
    return {
      grid,
      hand: removeFromHand({ hand: playerState.hand, tiles: [move.data.tile] }),
    };
  },

  // run on server

  getInitialGlobalState: ({ playerIds, random }) => {
    return {
      grid: {},
      playerHands: playerIds.reduce((hands, playerId) => {
        hands[playerId] = {
          tiles: new Array(HAND_SIZE)
            .fill(null)
            .map(() => random.item(SORTED_TILES)),
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

  getState: ({ initialState, moves, random }) => {
    return moves.reduce(
      (cur, move) => applyMoveToGlobalState(cur, move, random),
      {
        ...initialState,
      },
    );
  },

  getPublicMove: ({ move }) => {
    // TODO: process full move data into what players can see
    // (i.e. what should you know about other players' moves?)
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
const applyMoveToGlobalState = (
  globalState: GlobalState,
  move: Move<MoveData>,
  random: GameRandom,
) => {
  const grid = addTile(
    globalState.grid,
    move.data.coordinate,
    move.data.tile,
    move.userId,
  );
  if (!move.userId) {
    return {
      ...globalState,
      grid,
    };
  }
  const hand = removeFromHand({
    hand: globalState.playerHands[move.userId],
    tiles: [move.data.tile],
    random,
  });
  return {
    ...globalState,
    grid,
    playerHands: {
      ...globalState.playerHands,
      [move.userId]: hand,
    },
  };
};

function countTiles(tiles: (Tile | null)[]) {
  return tiles.reduce((counts, shape) => {
    if (!shape) return counts;
    counts[shape] = counts[shape] || 0;
    counts[shape]++;
    return counts;
  }, {} as Record<string, number>);
}

function toCoordinateKey(x: number, y: number): CoordinateKey {
  return `${x},${y}`;
}

function fromCoordinateKey(key: CoordinateKey) {
  const [x, y] = key.split(',');
  return { x: Number(x), y: Number(y) };
}

function addTile(
  grid: Grid,
  coordinate: Coordinate,
  tile: Tile,
  owner: string | null,
) {
  const key = toCoordinateKey(coordinate.x, coordinate.y);
  grid[key] = grid[key] || [];
  grid[key].push({ tile, owner });
  return grid;
}

/**
 * Removes tiles from a player's hand, replacing them with random tiles.
 * If no random is provided, tile slots are left empty (null)
 */
function removeFromHand({
  hand,
  tiles,
  random,
}: {
  hand: PlayerHand;
  tiles: Tile[];
  random?: GameRandom;
}): PlayerHand {
  const tilesPlayedCounts = countTiles(tiles);

  // iterate over tiles, replacing used tiles with random ones
  const newTiles = hand.tiles.map((tile) => {
    if (!tile) return tile;
    if (tilesPlayedCounts[tile]) {
      tilesPlayedCounts[tile]--;
      return random?.item(SORTED_TILES) ?? null;
    } else {
      return tile;
    }
  });

  return {
    ...hand,
    tiles: newTiles,
  };
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

function mergeTiles(tiles: Tile[]) {
  return tiles.reduce((merged, tile) => {
    const [a, b] = [merged, tile].sort();
    return MERGES[a][b];
  }, '·');
}

function scoreTile(grid: Grid, coordinate: Coordinate, tile: Tile) {
  // special case, '·' tiles never score as they have no connections
  if (tile === '·') {
    return 0;
  }

  const tileConnections = CONNECTIONS[tile];
  const adjacentCoords = getAdjacents(coordinate);
  const adjacentTiles: { tile: Tile; coordinate: Coordinate }[] =
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
