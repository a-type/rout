import { GameRandom } from '@long-game/game-definition';
import {
  BattingCompositeRatings,
  PitchingCompositeRatings,
  League,
  Player,
  PlayerAttributes,
} from './gameTypes';
import { avg, isPitcher, sum, sumObjects } from './utils';

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
  player: Player,
  attributes: PlayerAttributes,
): BattingCompositeRatings {
  const pitcher = player.positions.some((p) => isPitcher(p));
  const pitcherMod = pitcher ? -5 : 0;
  const {
    strength: str,
    agility: agi,
    constitution: con,
    wisdom: wis,
    intelligence: int,
  } = attributes;
  return {
    extraBases: avg(str, agi) + pitcherMod,
    hitAngle: avg(str, con) + pitcherMod,
    hitPower: avg(str, wis) + pitcherMod,
    homeRuns: avg(str, int) + pitcherMod,
    contact: avg(agi, con) + pitcherMod,
    stealing: avg(agi, wis) + pitcherMod,
    fielding: avg(agi, int) + pitcherMod,
    durability: avg(con, wis) + pitcherMod,
    plateDiscipline: avg(con, int) + pitcherMod,
    dueling: avg(wis, int) + pitcherMod,
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
    const attr = random.item(
      Object.keys(newAttributes),
    ) as keyof PlayerAttributes;
    newAttributes[attr] += 1;
  }
  return {
    ...player,
    attributes: newAttributes,
  };
}
