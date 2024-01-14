import { GameDefinition, Move, GameRandom } from '@long-game/game-definition';
import { lazy } from 'react';
import { GameRound } from '@long-game/common';
import { axialDistance, cloneDeep, generateAxialGrid } from './utils.js';

export type CoordinateKey = `${number},${number}`;
export type TerrainType =
  | 'desert'
  | 'forest'
  | 'mountain'
  | 'ocean'
  | 'grassland'
  | 'swamp'
  | 'tundra';

export type Terrain = {
  type: TerrainType;
};

export type Blessing = {
  location: TerrainType;
  points: number;
};

export type GlobalState = {
  terrainGrid: Record<CoordinateKey, Terrain>;
  flippedBlessings: Array<Blessing>;
  blessingDeck: Array<Blessing>;
  playerData: Record<string, PlayerData>;
};

export type PlayerData = {
  position: CoordinateKey;
  color: string;
  acquiredBlessings: Array<Blessing>;
};

export type PlayerState = {
  terrainGrid: Record<CoordinateKey, Terrain>;
  flippedBlessings: Array<Blessing>;
  remainingBlessingCount: number;
} & PlayerData;

export type MoveData = {
  position: CoordinateKey;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  MoveData,
  MoveData
> = {
  version: `v0.0`,

  // run on both client and server

  validateTurn: ({ playerState, moves }) => {
    if (moves.length > 1) {
      return 'You can only make one move per turn.';
    }
    for (const move of moves) {
      if (axialDistance(move.data.position, playerState.position) > 1) {
        return 'You must move at most once hex.';
      }
    }
    return;
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveMoves, playerId }) => {
    const finalMove =
      prospectiveMoves.length > 0
        ? prospectiveMoves[prospectiveMoves.length - 1]
        : null;
    return {
      ...playerState,
      position: finalMove ? finalMove.data.position : playerState.position,
    };
  },

  // run on server

  getInitialGlobalState: ({ playerIds, random }) => {
    const width = 7;
    const height = 5;
    const blessingCount = 10;
    const gridCoordinates = generateAxialGrid(4, 4);
    return {
      playerPositions: playerIds.reduce((acc, playerId) => {
        acc[playerId] = `${random.int(0, width - 1)},${random.int(
          0,
          height - 1,
        )}`;
        return acc;
      }, {} as Record<string, CoordinateKey>),
      terrainGrid: gridCoordinates.reduce((acc, key, i) => {
        acc[key] = {
          type: random.item([
            'desert',
            'forest',
            'mountain',
            'ocean',
            'grassland',
            'swamp',
            'tundra',
          ]),
        };
        return acc;
      }, {} as Record<CoordinateKey, Terrain>),
      flippedBlessings: [],
      blessingDeck: (
        Array.from({ length: blessingCount }).fill(null) as any[]
      ).map(() => ({
        location: random.item([
          'desert',
          'forest',
          'mountain',
          'ocean',
          'grassland',
          'swamp',
          'tundra',
        ]),
        points: random.int(1, 6) + random.int(1, 6),
      })),
      playerData: playerIds.reduce((acc, playerId) => {
        acc[playerId] = {
          position: random.item(gridCoordinates),
          color: random.item([
            '#FF0000',
            '#00FF00',
            '#0000FF',
            '#FFFF00',
            '#00FFFF',
            '#FF00FF',
          ]),
          acquiredBlessings: [],
        };
        return acc;
      }, {} as Record<string, PlayerData>),
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    const playerData = globalState.playerData[playerId];
    return {
      ...playerData,
      terrainGrid: globalState.terrainGrid,
      flippedBlessings: globalState.flippedBlessings,
      remainingBlessingCount: globalState.blessingDeck.length,
    };
  },

  getState: ({ initialState, rounds, random }) => {
    return rounds.reduce(
      (cur, round) => applyRoundToGlobalState(cur, round, random),
      initialState,
    );
  },

  getPublicMove: ({ move }) => {
    return move;
  },

  getStatus: ({ globalState, rounds }) => {
    if (globalState.blessingDeck.length === 0) {
      const winningPlayers = Object.keys(globalState.playerData).reduce(
        (acc, playerId) => {
          const blessings = globalState.playerData[playerId].acquiredBlessings;
          if (blessings.length > acc.length) {
            return [playerId];
          } else if (blessings.length === acc.length) {
            acc.push(playerId);
          }
          return acc;
        },
        [] as string[],
      );
      return { status: 'completed', winnerIds: winningPlayers };
    }
    return { status: 'active' };
  },
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Move<MoveData>>,
  random: GameRandom,
): GlobalState => {
  const { moves } = round;
  const { blessingDeck, flippedBlessings, playerData } = globalState;
  const newBlessingDeck = [...blessingDeck];
  let newFlippedBlessings = [...flippedBlessings];
  const nextBlessing = newBlessingDeck.shift();
  const newPlayerData = cloneDeep(playerData);

  // Figure out which players didn't move
  const playersThatDidntMove = moves.reduce((acc, move) => {
    if (!move.userId) {
      return acc;
    }
    const { position } = move.data;
    const prevPosition = globalState.playerData[move.userId].position;
    if (position === prevPosition) {
      acc.push(move.userId);
    }
    return acc;
  }, [] as string[]);

  // Claim blessings
  newFlippedBlessings = newFlippedBlessings.filter((blessing) => {
    const claimantPlayers = playersThatDidntMove.filter((playerId) => {
      const playerPosition = globalState.playerData[playerId].position;
      return globalState.terrainGrid[playerPosition].type === blessing.location;
    });
    claimantPlayers.forEach((playerId) => {
      newPlayerData[playerId].acquiredBlessings.push(blessing);
    });
    return claimantPlayers.length === 0;
  });

  // Add a new blessing to the revealed blessings and remove
  // the oldest blessing if there are too many
  if (nextBlessing) {
    newFlippedBlessings.push(nextBlessing);
  }
  while (newFlippedBlessings.length > 3) {
    // TODO: Move to a discard where players can view them.
    newFlippedBlessings.shift();
  }

  // Move players
  moves.forEach((move) => {
    if (!move.userId) {
      return;
    }
    const { position } = move.data;
    newPlayerData[move.userId].position = position;
  });
  return {
    ...globalState,
    blessingDeck: newBlessingDeck,
    flippedBlessings: newFlippedBlessings,
    playerData: newPlayerData,
  };
};
