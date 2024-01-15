import { GameRandom } from '@long-game/game-definition';
import { GlobalState, PlayerState, TurnData } from './gameDefinition.js';
import {
  getPlayerTerrain,
  getPlayersByCondition,
  getTerrainCoordinatesByCondition,
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
    name: 'Time passes',
    description: 'Nothing happens.',
    color: '#000000',
  },
  fireRelic: {
    name: 'Fire relic',
    description:
      'The fire relic will be discovered at the temple in the mountains.',
    color: '#FF7722',
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
    color: '#2266FF',
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
    color: '#99EE77',
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
    color: '#FFFF00',
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
  relicQuest: {
    name: 'Relic quest',
    description: 'The one that brings the relics together will be blessed',
    color: '#FFFFFF',
    roundEffect: (globalState: GlobalState, random: GameRandom) => {
      const relicItems = [
        'fireRelicItem',
        'waterRelicItem',
        'windRelicItem',
        'lightningRelicItem',
      ];
      const relicPlayers = getPlayersByCondition(
        globalState,
        ({ playerState: { inventory } }) =>
          inventory.filter((item) => relicItems.includes(item)).length >= 3,
      );
      if (relicPlayers.length === 0) {
        return false;
      }
      const chosenPlayer = random.item(relicPlayers);
      globalState.playerData[chosenPlayer].acquiredBlessings.push({
        location: 'forest',
        points: 20,
      });
      return true;
    },
  },
  crumblingCity: {
    name: 'Crumbling city',
    description: 'A city will crumble to ruins',
    color: '#000000',
    roundEffect: (globalState: GlobalState, random: GameRandom) => {
      const terrainCoords = getTerrainCoordinatesByCondition(
        globalState,
        ({ features }) => features.includes('city'),
      );
      if (terrainCoords.length === 0) {
        return false;
      }
      const chosenTerrain = random.item(terrainCoords);
      globalState.terrainGrid[chosenTerrain].features = globalState.terrainGrid[
        chosenTerrain
      ].features.filter((feature) => feature !== 'city');
      return true;
    },
  },
} satisfies Record<string, EventDefinition>;

export const eventDefinitions = definitions as Record<EventId, EventDefinition>;
