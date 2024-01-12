import { GameDefinition, Move, GameRandom } from '@long-game/game-definition';
import { lazy } from 'react';
import { GameRound } from '@long-game/common';

export type CoordinateKey = `${number},${number}`;
export type TerrainType = 'desert' | 'forest' | 'mountain' | 'ocean';

export type Terrain = {
  type: TerrainType;
}

export type Blessing = {
  location: TerrainType;
}

export type GlobalState = {
  terrainGrid: Record<CoordinateKey, Terrain>;
  flippedBlessings: Array<Blessing>;
  blessingDeck: Array<Blessing>;
  acquiredBlessings: Record<string, Array<Blessing>>;
  playerPositions: Record<string, CoordinateKey>;
};

export type PlayerState = {
  position: CoordinateKey;
  terrainGrid: Record<CoordinateKey, Terrain>;
  flippedBlessings: Array<Blessing>;
  acquiredBlessings: Record<string, Array<Blessing>>
  remainingBlessingCount: number;
};

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

  validateTurn: ({playerState, moves}) => {
    if (moves.length > 1) {
      return 'You can only make one move per turn.';
    }
    return;
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({playerState, prospectiveMoves, playerId}) => {
    const finalMove = prospectiveMoves.length > 0 ? prospectiveMoves[prospectiveMoves.length - 1] : null;
    return {
      ...playerState,
      position: finalMove ? finalMove.data.position : playerState.position,
    }
  },

  // run on server

  getInitialGlobalState: ({playerIds, random}) => {
    const width = 7;
    const height = 5;
    const blessingCount = 10;
    return {
      playerPositions: playerIds.reduce((acc, playerId) => {
        acc[playerId] = `${random.int(0, width - 1)},${random.int(0, height - 1)}`;
        return acc;
      }, {} as Record<string, CoordinateKey>),
      terrainGrid: (Array.from({length: width * height}).fill(null) as any[]).reduce((acc, _, i) => {
        const x = i % width;
        const y = Math.floor(i / width);
        const key = `${x},${y}`;
        acc[key] = {
          type: random.item(['desert', 'forest', 'mountain', 'ocean']),
        };
        return acc;
      }, {} as Record<CoordinateKey, Terrain>),
      flippedBlessings: [],
      blessingDeck: (Array.from({length: blessingCount}).fill(null) as any[]).map(() => ({
        location: random.item(['desert', 'forest', 'mountain', 'ocean']),
      })),
      acquiredBlessings: playerIds.reduce((acc, playerId) => {
        acc[playerId] = [];
        return acc;
      }, {} as Record<string, Array<Blessing>>),
    }
  },

  getPlayerState: ({globalState, playerId}) => {
    return {
      position: globalState.playerPositions[playerId],
      terrainGrid: globalState.terrainGrid,
      flippedBlessings: globalState.flippedBlessings,
      acquiredBlessings: globalState.acquiredBlessings,
      remainingBlessingCount: globalState.blessingDeck.length,
    };
  },

  getState: ({initialState, rounds, random}) => {
    return rounds.reduce(
      (cur, round) => applyRoundToGlobalState(cur, round, random),
      initialState,
    );
  },

  getPublicMove: ({move}) => {
    return move;
  },

  getStatus: ({globalState, rounds}) => {
    if (globalState.blessingDeck.length === 0)
    { 
      const winningPlayers = Object.keys(globalState.acquiredBlessings).reduce((acc, playerId) => {
        const blessings = globalState.acquiredBlessings[playerId];
        if (blessings.length > acc.length) {
          return [playerId];
        } else if (blessings.length === acc.length) {
          acc.push(playerId);
        }
        return acc;
      }, [] as string[]);
      return {status: "completed", winnerIds: winningPlayers};
    }
    return {status: "active"};
  },
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Move<MoveData>>,
  random: GameRandom,
): GlobalState =>{
  const { moves } = round;
  const { blessingDeck, flippedBlessings, acquiredBlessings } = globalState;
  const newBlessingDeck = [...blessingDeck];
  let newFlippedBlessings = [...flippedBlessings];
  const nextBlessing = newBlessingDeck.shift();
  const newAcquiredBlessings = {...acquiredBlessings};

  const playersThatDidntMove = moves.reduce((acc, move) => {
    if (!move.userId) {
      return acc;
    }
    const { position } = move.data;
    const prevPosition = globalState.playerPositions[move.userId];
    if (position === prevPosition) {
      acc.push(move.userId);
    }
    return acc;
  }, [] as string[]);

  // Claim blessings
  newFlippedBlessings = newFlippedBlessings.filter((blessing) => {
    const claimantPlayers = playersThatDidntMove.filter((playerId) => {
      const playerPosition = globalState.playerPositions[playerId];
      return globalState.terrainGrid[playerPosition].type === blessing.location;
    })
    claimantPlayers.forEach((playerId) => {
      newAcquiredBlessings[playerId].push(blessing);
    })
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
  return {
    ...globalState,
    blessingDeck: newBlessingDeck,
    flippedBlessings: newFlippedBlessings,
    acquiredBlessings: newAcquiredBlessings,
    playerPositions: moves.reduce((acc, move) => {
    if (!move.userId) {
      return acc;
    }
    acc[move.userId] = move.data.position;
    return acc;
   }, {} as Record<string, CoordinateKey>)
  };
}
