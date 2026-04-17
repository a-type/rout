import { GameRandom } from '@long-game/game-definition';
import {
  BattingCompositeRatings,
  BattingCompositeType,
  League,
  PitchingCompositeRatings,
  PitchingCompositeType,
  Player,
  PlayerAttributes,
} from './gameTypes.js';
import { avg, isPitcher, sum, sumObjects } from './utils.js';

export const PITCHER_BATTING_PENALTY = 5;

export function getPlayerOverall(player: Player): number {
  const attributes = player.attributes;
  return sum(...Object.values(attributes));
}

export function getTeamAvgAttributes(
  league: League,
  teamId: string,
): Record<keyof PlayerAttributes | 'overall', number> {
  const team = league.teamLookup[teamId];
  if (!team) {
    throw new Error(`Team with ID ${teamId} not found`);
  }
  const players = team.playerIds.map(
    (playerId) => league.playerLookup[playerId],
  );

  const totalAttributes = players.reduce(
    (acc, player) => {
      return sumObjects(acc, {
        ...player.attributes,
        overall: getPlayerOverall(player),
      });
    },
    {} as Record<string, number>,
  );
  const avgAttributes = Object.entries(totalAttributes).reduce(
    (acc, [key, value]) => {
      acc[key] = value / players.length;
      return acc;
    },
    {} as Record<string, number>,
  );
  return avgAttributes;
}

export function getBattingCompositeRatings(
  player: Player,
  attributes: PlayerAttributes,
): BattingCompositeRatings {
  const pitcher = player.positions.some((p) => isPitcher(p));
  const pitcherMod = pitcher ? -PITCHER_BATTING_PENALTY : 0;
  const {
    strength: str,
    agility: agi,
    constitution: con,
    wisdom: wis,
    intelligence: int,
  } = attributes;
  return Object.fromEntries(
    Object.entries({
      extraBases: [str, agi],
      hitAngle: [str, con],
      hitPower: [str, wis],
      homeRuns: [str, int],
      contact: [agi, con],
      stealing: [agi, wis],
      fielding: [agi, int],
      durability: [con, wis],
      plateDiscipline: [con, int],
      dueling: [wis, int],
    }).map(([key, attrs]) => {
      const advantaged = player.advantageTypes.includes(
        key as BattingCompositeType,
      );
      const disadvantaged = player.disadvantageTypes.includes(
        key as BattingCompositeType,
      );
      if (advantaged) {
        return [key, Math.max(...attrs) + pitcherMod];
      }
      if (disadvantaged) {
        return [key, Math.min(...attrs) + pitcherMod];
      }
      return [key, avg(...attrs) + pitcherMod];
    }),
  ) as BattingCompositeRatings;
}

export function getPitchingCompositeRatings(
  player: Player,
  attributes: PlayerAttributes,
): PitchingCompositeRatings {
  const {
    strength: str,
    agility: agi,
    constitution: con,
    wisdom: wis,
    intelligence: int,
  } = attributes;
  return Object.fromEntries(
    Object.entries({
      contact: [str, agi],
      hitAngle: [str, con],
      velocity: [str, wis],
      strikeout: [str, int],
      accuracy: [agi, con],
      hitPower: [agi, wis],
      movement: [agi, int],
      durability: [con, wis],
      composure: [con, int],
      dueling: [wis, int],
    }).map(([key, attrs]) => {
      const advantaged = player.advantageTypes.includes(
        key as PitchingCompositeType,
      );
      const disadvantaged = player.disadvantageTypes.includes(
        key as PitchingCompositeType,
      );
      if (advantaged) {
        return [key, Math.max(...attrs)];
      }
      if (disadvantaged) {
        return [key, Math.min(...attrs)];
      }
      return [key, avg(...attrs)];
    }),
  ) as PitchingCompositeRatings;
}

export function getXpForLevel(level: number): number {
  return 20 + Math.floor((level + 5) ** 1.5);
}

export function getLevelFromXp(xp: number): { level: number; xp: number } {
  let level = 0;
  while (xp >= getXpForLevel(level)) {
    xp -= getXpForLevel(level);
    level++;
  }
  return { level: level + 1, xp };
}

export function applyLevelup(
  random: GameRandom,
  player: Player,
  count: number = 1,
): Player {
  const newAttributes: PlayerAttributes = { ...player.attributes };
  for (let i = 0; i < count; i++) {
    const times = random.int(1, 3); // Randomly choose how many attributes to increase
    for (let j = 0; j < times; j++) {
      const attr = random.item(
        Object.keys(newAttributes),
      ) as keyof PlayerAttributes;
      newAttributes[attr] += 1;
    }
  }
  return {
    ...player,
    attributes: newAttributes,
  };
}
