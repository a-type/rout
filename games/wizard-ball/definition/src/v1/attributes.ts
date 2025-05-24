import { League, Player, PlayerAttributes } from './gameTypes';
import { sum, sumObjects } from './utils';

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
