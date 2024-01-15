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
import { EventId, eventDefinitions } from './events.js';
import { ItemId, itemDefinitions } from './items.js';

export type CoordinateKey = `${number},${number}`;
export type CardDefinition = {
  name: string;
  description: string;
  color?: string;
  tags?: Array<string>;
};

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
  activeEvents: Array<EventId>;
  futureDeck: Array<EventId>;
  playerData: Record<string, PlayerData>;
};

export type PlayerData = {
  position: CoordinateKey;
  color: string;
  acquiredBlessings: Array<Blessing>;
  inventory: Array<ItemId>;
  inventoryLimit: number;
};

export type PlayerState = {
  terrainGrid: Record<CoordinateKey, Terrain>;
  activeEvents: Array<EventId>;
  remainingBlessingCount: number;
  movement: number;
} & PlayerData;

export type TurnData = {
  positions: Array<CoordinateKey>;
};

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
    const gridCoordinates = generateAxialGrid(5, 5);
    return {
      terrainGrid: baseMap(),
      activeEvents: [],
      futureDeck: [
        'crumblingCity',
        'empty',
        'fireRelic',
        'empty',
        'waterRelic',
        'empty',
        'lightningRelic',
        'empty',
        'windRelic',
        'empty',
        'empty',
        'relicQuest',
        'empty',
        'empty',
        'empty',
        'empty',
        'empty',
        'empty',
        'empty',
      ],
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
              .map(() => 'food' as ItemId),
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
      activeEvents: globalState.activeEvents,
      remainingBlessingCount: globalState.futureDeck.length,
      movement: 3,
    };
  },

  getState: ({ initialState, rounds, random }) => {
    return rounds.reduce((cur, round) => {
      let nextState = applyRoundToGlobalState(cur, round, random);
      return applyEventsToGlobalState(nextState, random);
    }, initialState);
  },

  getPublicTurn: ({ turn }) => {
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    if (globalState.futureDeck.length === 0) {
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
  const nextGlobalState = cloneDeep(globalState);

  const moves = turns.map((turn) => ({
    userId: turn.userId,
    data: turn.data,
  }));

  // Pay sustenance
  Object.keys(nextGlobalState.playerData).forEach((playerId) => {
    nextGlobalState.playerData[playerId].inventory = removeFirst(
      nextGlobalState.playerData[playerId].inventory,
      (item) => !!itemDefinitions[item]?.tags?.includes('food'),
    );
  });

  // Move players
  moves.forEach((move) => {
    if (!move.userId) {
      return;
    }
    const position = last(move.data.positions);
    if (position) {
      nextGlobalState.playerData[move.userId].position = position;
    }
  });

  // Check for getting food
  Object.keys(nextGlobalState.playerData).forEach((playerId) => {
    const player = nextGlobalState.playerData[playerId];
    const terrain = globalState.terrainGrid[player.position];
    if (terrain.features.includes('city')) {
      while (player.inventory.length < player.inventoryLimit) {
        player.inventory.push('food');
      }
    }
  });
  return nextGlobalState;
};

const applyEventsToGlobalState = (
  globalState: GlobalState,
  random: GameRandom,
): GlobalState => {
  let nextGlobalState = cloneDeep(globalState);
  const nextEvent = nextGlobalState.futureDeck.shift();
  if (nextEvent) {
    eventDefinitions[nextEvent].reveal?.(nextGlobalState, random);
  }
  nextGlobalState.activeEvents = nextGlobalState.activeEvents.filter(
    (eventId) =>
      !eventDefinitions[eventId].roundEffect?.(nextGlobalState, random),
  );
  if (nextEvent) {
    nextGlobalState.activeEvents.push(nextEvent);
  }
  while (nextGlobalState.activeEvents.length > 5) {
    nextGlobalState.activeEvents.shift();
  }
  return nextGlobalState;
};
