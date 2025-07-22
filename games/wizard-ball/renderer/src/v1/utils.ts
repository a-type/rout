import {
  AttributeType,
  BattingCompositeType,
  HitArea,
  HitType,
  PitchingCompositeType,
} from '@long-game/game-wizard-ball-definition';
import { TurnData } from '@long-game/game-wizard-ball-definition/v1';
import { hooks } from './gameClient.js';

export function roundFloat(value: number, decimalPlaces: number = 2): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

export function toPercentage(value: number, decimalPlaces: number = 1): string {
  return `${roundFloat(value * 100, decimalPlaces)}%`;
}

export function attributeToColor(
  value: number,
  max: number = 20,
): {
  bg: string;
  text: string;
} {
  // Clamp value between 1 and max
  const v = Math.max(1, Math.min(value, max));
  // Calculate percentage (0 = red, 0.5 = yellow, 1 = green)
  const percent = (v - 1) / (max - 1);
  // Interpolate color: red (255,0,0) -> yellow (255,255,0) -> green (0,200,0)
  let r, g, b;
  if (percent < 0.5) {
    // red to yellow
    r = 255;
    g = Math.round(255 * (percent / 0.5));
    b = 0;
  } else {
    // yellow to green
    r = Math.round(255 * (1 - (percent - 0.5) / 0.5));
    g = 200;
    b = 0;
  }
  const bg = `rgb(${r},${g},${b}, .8)`;
  const text = `rgb(${r},${g},${b}, 1)`;
  return { bg, text };
}

export function nthToString(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'][
    n % 100 >= 11 && n % 100 <= 13 ? 0 : n % 10 > 3 ? 0 : n % 10
  ];
  return `${n}${suffix}`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function hitDirectionToString(hitArea: HitArea): string {
  switch (hitArea) {
    case 'left':
      return 'left center';
    case 'center':
      return 'center';
    case 'right':
      return 'right center';
    case 'farLeft':
      return 'left';
    default:
      return 'Unknown Hit Direction';
  }
}

export function hitTypeToString(hitType: HitType): string {
  switch (hitType) {
    case 'fly':
      return 'fly ball';
    case 'grounder':
      return 'ground ball';
    case 'lineDrive':
      return 'line drive';
    case 'popUp':
      return 'pop up';
    default:
      return 'Unknown Hit Type';
  }
}

export function pitchQualityToString(quality: number): string {
  if (quality < 0.2) {
    return 'terrible';
  }
  if (quality < 0.4) {
    return 'awful';
  }
  if (quality < 0.6) {
    return 'bad';
  }
  if (quality < 0.8) {
    return 'mediocre';
  }
  if (quality < 1) {
    return 'middling';
  }
  if (quality < 1.2) {
    return 'great';
  }
  if (quality < 1.5) {
    return 'excellent';
  }
  return 'elite';
}

export function shortAttribute(key: AttributeType): string {
  const lookup: Record<AttributeType, string> = {
    agility: 'Agi',
    charisma: 'Cha',
    constitution: 'Con',
    intelligence: 'Int',
    strength: 'Str',
    wisdom: 'Wis',
  };
  return lookup[key];
}

export function compositeToString(
  key: BattingCompositeType | PitchingCompositeType,
): string {
  const lookup: Record<BattingCompositeType | PitchingCompositeType, string> = {
    contact: 'Contact',
    accuracy: 'Accuracy',
    hitAngle: 'Hit angle',
    hitPower: 'Hit power',
    extraBases: 'Extra bases',
    homeRuns: 'Home runs',
    fielding: 'Fielding',
    stealing: 'Stealing',
    durability: 'Durability',
    plateDiscipline: 'Plate discipline',
    dueling: 'Dueling',
    movement: 'Movement',
    velocity: 'Velocity',
    strikeout: 'Strikeout',
    composure: 'Composure',
  };
  return lookup[key];
}

export function useSendTurn() {
  const {
    submitTurn,
    nextRoundCheckAt,
    prepareTurn,
    currentTurn,
    turnWasSubmitted,
  } = hooks.useGameSuite();
  return (fn: (turnData: TurnData | null) => TurnData) => {
    if (nextRoundCheckAt && turnWasSubmitted) {
      return submitTurn({ data: fn(currentTurn) });
    }
    return prepareTurn(fn);
  };
}

export function numberToLetter(num: number): string {
  const v = Math.round(num);
  if (v <= 2) return 'F-';
  if (v <= 4) return 'F';
  if (v <= 6) return 'D-';
  if (v === 7) return 'D';
  if (v === 8) return 'D+';
  if (v === 9) return 'C-';
  if (v === 10) return 'C';
  if (v === 11) return 'C+';
  if (v === 12) return 'B-';
  if (v === 13) return 'B';
  if (v === 14) return 'B+';
  if (v === 15) return 'A-';
  if (v === 16) return 'A';
  if (v === 17) return 'A+';
  return 'S';
}

export function staminaToText(stamina: number): string {
  if (stamina < 0.2) return 'Exhausted';
  if (stamina < 0.4) return 'Very tired';
  if (stamina < 0.6) return 'Tired';
  if (stamina < 0.8) return 'Good';
  return 'Fresh';
}

export function numberToWord(n: number): string {
  const words = ['zero', 'one', 'two', 'three'];
  if (n < 0 || n >= words.length) {
    return n.toString(); // Fallback for numbers outside the range
  }
  return words[n];
}
