import { GameRandom } from '@long-game/game-definition';
import { GlobalState, PlayerState, TurnData } from './gameDefinition.js';
import {
  getPlayerTerrain,
  getPlayersByCondition,
  giveItemToPlayer,
} from './gameStateHelpers.js';

type EventDefinition = {
  name: string;
  description: string;
  color: string;
  /** Effect to apply on reveal. Return true if the event should be removed afterwards. */
  reveal?: (globalState: GlobalState, random: GameRandom) => boolean;
  /** Effect to apply each round. Return true if the event should be removed afterwards. */
  roundEffect?: (globalState: GlobalState, random: GameRandom) => boolean;
};

export type EventId = keyof typeof definitions;

const definitions = {
  empty: {
    name: 'Nothing',
    description: 'Nothing happens.',
    color: '#000',
  },
  fireRelic: {
    name: 'Fire relic',
    description:
      'The fire relic will be discovered at the temple in the mountains.',
    color: '#F72',
    roundEffect: (globalState: GlobalState, random: GameRandom) => {
      const validPlayers = getPlayersByCondition(
        globalState,
        ({ terrain }) =>
          terrain.type === 'mountain' && terrain.features.includes('temple'),
      );

      if (validPlayers.length === 0) {
        return false;
      }
      const chosenPlayer = random.item(validPlayers);
      giveItemToPlayer(globalState, chosenPlayer, 'fireRelicItem');
      return true;
    },
  },
  waterRelic: {
    name: 'Water relic',
    description:
      'The water relic will be discovered at the temple in the lake.',
    color: '#26F',
    roundEffect: (globalState: GlobalState, random: GameRandom) => {
      const validPlayers = getPlayersByCondition(
        globalState,
        ({ terrain }) =>
          terrain.type === 'ocean' && terrain.features.includes('temple'),
      );

      if (validPlayers.length === 0) {
        return false;
      }
      const chosenPlayer = random.item(validPlayers);
      giveItemToPlayer(globalState, chosenPlayer, 'waterRelicItem');
      return true;
    },
  },
  windRelic: {
    name: 'Wind relic',
    description:
      'The wind relic will be discovered at the temple in the tundra.',
    color: '#9E7',
    roundEffect: (globalState: GlobalState, random: GameRandom) => {
      const validPlayers = getPlayersByCondition(
        globalState,
        ({ terrain }) =>
          terrain.type === 'tundra' && terrain.features.includes('temple'),
      );

      if (validPlayers.length === 0) {
        return false;
      }
      const chosenPlayer = random.item(validPlayers);
      giveItemToPlayer(globalState, chosenPlayer, 'windRelicItem');
      return true;
    },
  },
  lightningRelic: {
    name: 'Lightning relic',
    description:
      'The lightning relic will be discovered at the temple in the desert.',
    color: '#FF0',
    roundEffect: (globalState: GlobalState, random: GameRandom) => {
      const validPlayers = getPlayersByCondition(
        globalState,
        ({ terrain }) =>
          terrain.type === 'desert' && terrain.features.includes('temple'),
      );

      if (validPlayers.length === 0) {
        return false;
      }
      const chosenPlayer = random.item(validPlayers);
      giveItemToPlayer(globalState, chosenPlayer, 'lightningRelicItem');
      return true;
    },
  },
} satisfies Record<string, EventDefinition>;

export const eventDefinitions = definitions as Record<EventId, EventDefinition>;
