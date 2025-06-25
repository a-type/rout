import { LeagueGameState } from './gameTypes';
import { PerkEffect } from './perkData';
import { logger } from './sim/simGames';

export type Weather = {
  name: string;
  description: string;
  icon: string;
  color: string; // Optional color for UI representation
  effect: (props: { gameState: LeagueGameState }) => PerkEffect;
};

export type WeatherType = keyof typeof weather;

export const weather = {
  clear: {
    name: 'Clear',
    icon: '☀️',
    color: '#fff',
    description: 'A pleasant day with no weather effects.',
    effect: () => ({}),
  },
  rain: {
    name: 'Rain',
    icon: '🌧️',
    color: '#1976d2',
    description:
      'Rain reduces pitching accuracy and reduces the chance of extra base hits.',
    effect: () => ({
      battingCompositeBonus: {
        extraBases: -2,
      },
      pitchingCompositeBonus: {
        accuracy: -2,
      },
      hitModifierTable: {
        type: {
          grounder: 1.2,
          lineDrive: 0.8,
          fly: 0.8,
          popUp: 1,
        },
      },
    }),
  },
  heat: {
    name: 'Heat',
    icon: '🔥',
    color: '#d32f2f',
    description:
      'Heat reduces stamina recovery and increases the chance of home runs.',
    effect: () => ({
      battingCompositeBonus: {
        homeRuns: 2,
        durability: -2,
      },
      pitchingCompositeBonus: {
        velocity: 2,
        durability: -2,
      },
    }),
  },
  snow: {
    name: 'Snow',
    icon: '❄️',
    color: '#90caf9',
    description: 'Snow drastically reduces speed and reduces hitting power.',
    effect: () => ({
      attributeBonus: {
        agility: -2,
      },
      battingCompositeBonus: {
        stealing: -2,
        hitPower: -2,
      },
    }),
  },
  lightningStorm: {
    name: 'Lightning Storm',
    icon: '⚡',
    color: '#e1bee7',
    description:
      'A dangerous storm that increases strikeout rate and frequency of big hits while reducing the chance of making contact.',
    effect: () => ({
      battingCompositeBonus: {
        hitPower: 3,
        contact: -3,
      },
      pitchingCompositeBonus: {
        strikeout: 2,
      },
    }),
  },
  fog: {
    name: 'Fog',
    icon: '🌫️',
    color: '#b0bec5',
    description:
      'Fog reduces visibility, making pitching, hitting, and fielding all suffer from lower accuracy.',
    effect: () => ({
      battingCompositeBonus: {
        contact: -3,
        fielding: -3,
      },
      pitchingCompositeBonus: {
        accuracy: -3,
      },
    }),
  },
  windy: {
    name: 'Windy',
    icon: '💨',
    color: '#c5cae9',
    description:
      'Windy conditions increase the chance of fly balls and improve pitching movement.',
    effect: () => ({
      battingCompositeBonus: {
        hitAngle: 3,
      },
      pitchingCompositeBonus: {
        movement: 3,
      },
      hitModifierTable: {
        type: {
          grounder: 0.8,
          lineDrive: 1,
          fly: 1.2,
          popUp: 1.1,
        },
      },
    }),
  },
  blessedRain: {
    name: 'Blessed Rain',
    icon: '✨',
    color: '#eca334',
    description:
      'A mystical rain that blesses players when they make defensive plays.',
    effect: () => ({
      trigger: ({ event, player, gameState }) => {
        if (event.kind !== 'defenderOut') {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player was blessed by the rain!',
            source: { kind: 'weather', id: 'blessedRain' },
            important: true,
          },
          gameState,
        );
        player.statusIds.bless = (player.statusIds.bless ?? 0) + 1;
        return gameState;
      },
    }),
  },
  bloodRain: {
    name: 'Blood Rain',
    icon: '🩸',
    color: '#f44336',
    description:
      'A sinister rain that sometimes causes players to become injured when they get hits.',
    effect: () => ({
      trigger: ({ event, player, gameState, random }) => {
        if (event.kind !== 'hit' || event.isPitcher) {
          return gameState;
        }
        if (random.float(0, 1) > 0.1) {
          return gameState;
        }
        gameState = logger.addToGameLog(
          {
            kind: 'trigger',
            playerId: player.id,
            description: 'Player was injured by blood rain.',
            source: { kind: 'weather', id: 'bloodRain' },
            important: true,
          },
          gameState,
        );
        player.statusIds.injured =
          (player.statusIds.injured ?? 1) + random.int(2, 10);
        return gameState;
      },
    }),
  },
} satisfies Record<string, Weather>;
