import {
  GameDefinition,
  Turn,
  GameRandom,
  roundFormat,
} from '@long-game/game-definition';
import { lazy } from 'react';
import { GameRound } from '@long-game/common';
import {
  axialDistance,
  cloneDeep,
  generateAxialGrid,
  last,
  removeFirst,
} from './utils.js';
import { movementCosts } from './components/terrain.js';
import { baseMap } from './map.js';

export type CoordinateKey = `${number},${number}`;
export type TerrainType =
  | 'desert'
  | 'forest'
  | 'mountain'
  | 'ocean'
  | 'grassland'
  | 'swamp'
  | 'tundra';

export type TerrainFeature = 'city' | 'ruins' | 'temple';

export type Terrain = {
  type: TerrainType;
  features: Array<TerrainFeature>;
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

type ItemTag = 'food';

export type Item = {
  name: string;
  description: string;
  tags: Array<ItemTag>;
};

export type PlayerData = {
  position: CoordinateKey;
  color: string;
  acquiredBlessings: Array<Blessing>;
  inventory: Array<Item>;
  inventoryLimit: number;
};

export type PlayerState = {
  terrainGrid: Record<CoordinateKey, Terrain>;
  flippedBlessings: Array<Blessing>;
  remainingBlessingCount: number;
  movement: number;
} & PlayerData;

export type TurnData = {
  positions: Array<CoordinateKey>;
};

const STARTING_INVENTORY_LIMIT = 5;

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: `v0.0`,

  getRoundIndex: roundFormat.sync(),

  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    let playerPosition = playerState.position;
    let remainingMovement = playerState.movement;
    for (const movePosition of turn.data.positions) {
      if (remainingMovement <= 0) {
        return 'You have no remaining movement.';
      }
      if (axialDistance(movePosition, playerPosition) > 1) {
        return 'You must move at most once hex per move.';
      }
      playerPosition = movePosition;
      remainingMovement -=
        movementCosts[playerState.terrainGrid[playerPosition].type];
    }
    return;
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn, playerId }) => {
    return {
      ...playerState,
      position: last(prospectiveTurn.data.positions) ?? playerState.position,
    };
  },

  // run on server

  getInitialGlobalState: ({ playerIds, random }) => {
    const blessingCount = 10;
    const gridCoordinates = generateAxialGrid(5, 5);
    return {
      terrainGrid: baseMap(),
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
            '#DD7777',
            '#77DD77',
            '#7777DD',
            '#DDDD77',
            '#77DDDD',
            '#DD77DD',
          ]),
          acquiredBlessings: [],
          inventory: [
            ...Array.from({ length: 5 })
              .fill(null)
              .map(
                () =>
                  ({
                    name: 'Food',
                    description: 'Food',
                    tags: ['food'],
                  } as Item),
              ),
          ],
          inventoryLimit: 5,
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
      movement: 3,
    };
  },

  getState: ({ initialState, rounds, random }) => {
    return rounds.reduce(
      (cur, round) => applyRoundToGlobalState(cur, round, random),
      initialState,
    );
  },

  getPublicTurn: ({ turn }) => {
    return turn;
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
  round: GameRound<Turn<TurnData>>,
  random: GameRandom,
): GlobalState => {
  const { turns } = round;
  const { blessingDeck, flippedBlessings, playerData } = globalState;
  const newBlessingDeck = [...blessingDeck];
  let newFlippedBlessings = [...flippedBlessings];
  const nextBlessing = newBlessingDeck.shift();
  const newPlayerData = cloneDeep(playerData);

  const moves = turns.map((turn) => ({
    userId: turn.userId,
    data: turn.data,
  }));

  // Figure out which players didn't move
  const playersThatDidntMove = moves.reduce((acc, move) => {
    if (!move.userId) {
      return acc;
    }
    const position = last(move.data.positions);
    const prevPosition = globalState.playerData[move.userId].position;
    if (!position || position === prevPosition) {
      acc.push(move.userId);
    }
    return acc;
  }, [] as string[]);

  // Pay sustenance
  Object.keys(newPlayerData).forEach((playerId) => {
    newPlayerData[playerId].inventory = removeFirst(
      newPlayerData[playerId].inventory,
      (item) => item.tags.includes('food'),
    );
  });

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
    const position = last(move.data.positions);
    if (position) {
      newPlayerData[move.userId].position = position;
    }
  });

  // Check for getting food
  Object.keys(newPlayerData).forEach((playerId) => {
    const player = newPlayerData[playerId];
    const terrain = globalState.terrainGrid[player.position];
    if (terrain.features.includes('city')) {
      while (player.inventory.length < player.inventoryLimit) {
        player.inventory.push({
          name: 'Food',
          description: 'Food',
          tags: ['food'],
        } as Item);
      }
    }
  });
  return {
    ...globalState,
    blessingDeck: newBlessingDeck,
    flippedBlessings: newFlippedBlessings,
    playerData: newPlayerData,
  };
};
