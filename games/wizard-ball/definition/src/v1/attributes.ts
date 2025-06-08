import {
  BattingCompositeRatings,
  PitchingCompositeRatings,
  League,
  Player,
  PlayerAttributes,
} from './gameTypes';
import { avg, sum, sumObjects } from './utils';

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

  const totalAttributes = players.reduce((acc, player) => {
    return sumObjects(acc, {
      ...player.attributes,
      overall: getPlayerOverall(player),
    });
  }, {} as Record<string, number>);
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
  attributes: PlayerAttributes,
): BattingCompositeRatings {
  const {
    strength: str,
    agility: agi,
    constitution: con,
    wisdom: wis,
    intelligence: int,
  } = attributes;
  return {
    extraBases: avg(str, agi),
    hitAngle: avg(str, con),
    hitPower: avg(str, wis),
    homeRuns: avg(str, int),
    contact: avg(agi, con),
    stealing: avg(agi, wis),
    fielding: avg(agi, int),
    durability: avg(con, wis),
    plateDiscipline: avg(con, int),
    dueling: avg(wis, int),
  };
}

export function getPitchingCompositeRatings(
  attributes: PlayerAttributes,
): PitchingCompositeRatings {
  const {
    strength: str,
    agility: agi,
    constitution: con,
    wisdom: wis,
    intelligence: int,
  } = attributes;
  return {
    contact: avg(str, agi),
    hitAngle: avg(str, con),
    velocity: avg(str, wis),
    strikeout: avg(str, int),
    accuracy: avg(agi, con),
    hitPower: avg(agi, wis),
    movement: avg(agi, int),
    durability: avg(con, wis),
    composure: avg(con, int),
    dueling: avg(wis, int),
  };
}

export function getXpForLevel(level: number): number {
  return 10 + level ** 2;
}

export function getLevelFromXp(xp: number): number {
  let level = 0;
  while (xp >= getXpForLevel(level)) {
    xp -= getXpForLevel(level);
    level++;
  }
  return level;
}
