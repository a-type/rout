import { LeagueGameState } from './gameTypes';
import { PerkEffect } from './perkData';

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
        durability: -3,
      },
      pitchingCompositeBonus: {
        velocity: 2,
        durability: -3,
      },
    }),
  },
  snow: {
    name: 'Snow',
    icon: '❄️',
    color: '#90caf9',
    description:
      'Snow drastically reduces speed (especially when stealing) and reduces hitting power.',
    effect: () => ({
      attributeBonus: {
        agility: -2,
      },
      battingCompositeBonus: {
        stealing: -3,
        hitPower: -3,
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
        hitPower: 4,
        contact: -4,
      },
      pitchingCompositeBonus: {
        strikeout: 3,
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
        contact: -4,
        fielding: -4,
      },
      pitchingCompositeBonus: {
        accuracy: -4,
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
        hitAngle: 4,
      },
      pitchingCompositeBonus: {
        movement: 4,
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
} satisfies Record<string, Weather>;
