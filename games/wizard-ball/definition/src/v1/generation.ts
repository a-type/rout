import { GameRandom } from '@long-game/game-definition';
import {
  GameId,
  League,
  LeagueRound,
  Player,
  Position,
  Team,
  TeamId,
} from './gameTypes';
import { femaleFirstNames, lastNames, maleFirstNames } from './names';
import { teamAdjectives, teamNouns } from './teamNames';
import { PrefixedId } from '@long-game/common';

export function generateLeague(
  random: GameRandom,
  members: PrefixedId<'u'>[],
): League {
  let league: League = {
    name: 'League name',
    teamIds: [],
    playerLookup: {},
    teamLookup: {},
    schedule: [],
    gameResults: [],
    currentWeek: 0,
  };

  // Generate teams
  const teams = Array.from({ length: 10 }).map(() => generateTeam(random));
  const teamNames = generateTeamNames(random, teams.length);
  teams.forEach((team, index) => {
    team.name = teamNames[index].name;
    team.icon = teamNames[index].icon;
    league.teamIds.push(team.id);
    league.teamLookup[team.id] = team;
  });

  // Assign owners to teams
  for (let i = 0; i < members.length; i++) {
    const team = teams[i % teams.length];
    team.ownerId = members[i];
  }

  // Generate and assign players to teams
  for (const team of teams) {
    const numPlayers = 9;
    const forcedPositions: Position[] = [
      'c',
      '1b',
      '2b',
      '3b',
      'ss',
      'lf',
      'cf',
      'rf',
      'p',
      'p',
      'p',
      'p',
      'p',
    ];
    for (let i = 0; i < numPlayers; i++) {
      const player = generatePlayer(random, { position: forcedPositions[i] });
      player.teamId = team.id;
      team.playerIds.push(player.id);
      team.battingOrder.push(player.id);
      league.playerLookup[player.id] = player;
    }
  }

  // Generate schedule
  // This is a simple round-robin schedule
  const numTeams = league.teamIds.length;
  const rounds = 20;
  const teamIds = [...league.teamIds];
  if (numTeams % 2 !== 0) {
    teamIds.push('BYE' as TeamId); // Add a dummy team if odd number
  }
  const n = teamIds.length;
  for (let round = 0; round < rounds; round++) {
    const roundGames: LeagueRound = [];
    for (let i = 0; i < n / 2; i++) {
      const home = teamIds[i];
      const away = teamIds[n - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        // Alternate home/away by round for balance
        if (round % 2 === 0) {
          roundGames.push({
            id: random.id(),
            homeTeamId: home,
            awayTeamId: away,
          });
        } else {
          roundGames.push({
            id: random.id(),
            homeTeamId: away,
            awayTeamId: home,
          });
        }
      }
    }
    league.schedule.push(roundGames);
    // Rotate teams (except the first one)
    teamIds.splice(1, 0, teamIds.pop()!);
  }

  return league;
}

function generateTeam(random: GameRandom): Team {
  let team: Team = {
    name: 'Unnaemed Team',
    icon: '⚾',
    ownerId: null,
    id: random.id(),
    playerIds: [],
    battingOrder: [],
    wins: 0,
    losses: 0,
  };
  return team;
}

function generatePlayer(
  random: GameRandom,
  options: { position?: Position } = {},
): Player {
  const { position: forcedPosition } = options;
  let player: Player = {
    name: generatePlayerName(random),
    id: random.id(),
    teamId: null,
    positions: forcedPosition ? [forcedPosition] : [],
    attributes: generateAttributes(random),
  };
  const positions: Position[] = ['1b', '2b', '3b', 'ss', 'lf', 'cf', 'rf', 'p'];
  if (player.positions.length === 0) {
    player.positions.push(random.item(positions));
  }
  const extraPositions = random.int(0, 2);
  for (let i = 0; i < extraPositions; i++) {
    const position = random.item(positions);
    if (!player.positions.includes(position)) {
      player.positions.push(position);
    }
  }

  return player;
}

function generateAttributes(random: GameRandom): Player['attributes'] {
  const pool = Array.from({ length: 8 }, (_, i) => i + 1)
    .map(() => random.int(1, 21))
    .sort((a, b) => a - b);
  const results = random.shuffle(pool.slice(1, -1));
  return {
    strength: results[0],
    agility: results[1],
    constitution: results[2],
    wisdom: results[3],
    intelligence: results[4],
    charisma: results[5],
  };
}

function generateTeamNames(
  random: GameRandom,
  count: number,
): { name: string; icon: string }[] {
  const adjectives = random.shuffle(teamAdjectives);
  const nouns = random.shuffle(teamNouns);
  const names: { name: string; icon: string }[] = [];
  for (let i = 0; i < count; i++) {
    const adjective = adjectives[i % adjectives.length];
    const { text: noun, icon } = nouns[i % nouns.length];
    names.push({ name: `${adjective} ${noun}`, icon });
  }
  return names;
}

function generatePlayerName(random: GameRandom): string {
  const firstName =
    random.int(0, 2) === 0
      ? random.item(maleFirstNames)
      : random.item(femaleFirstNames);
  const lastName = random.item(lastNames);
  return `${firstName} ${lastName}`;
}
