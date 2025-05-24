import { GameRandom } from '@long-game/game-definition';
import {
  League,
  LeagueRound,
  Player,
  Position,
  Team,
  TeamId,
} from './gameTypes';
import { names } from './names';
import { teamAdjectives, teamNouns } from './teamNames';
import { PrefixedId } from '@long-game/common';
import { speciesData, SpeciesType } from './speciesData';
import { classData, ClassType } from './classData';
import { perks } from './perkData';

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
    const numPlayers = 16;
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
    ];
    team.battingOrder = forcedPositions.slice(0, 9);
    for (let i = 0; i < numPlayers; i++) {
      const player = generatePlayer(random, { position: forcedPositions[i] });
      const position = player.positions[0];
      player.teamId = team.id;
      team.playerIds.push(player.id);
      if (position !== 'p' && team.positionChart[position] === null) {
        team.positionChart[position] = player.id;
      }
      if (forcedPositions[i] === 'p') {
        team.pitchingOrder.push(player.id);
      }
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
    name: 'Unnamed Team',
    icon: '⚾',
    ownerId: null,
    id: random.id(),
    playerIds: [],
    battingOrder: [],
    pitchingOrder: [],
    positionChart: {
      c: null,
      '1b': null,
      '2b': null,
      '3b': null,
      ss: null,
      lf: null,
      cf: null,
      rf: null,
    },
    nextPitcherIndex: 0,
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
  const species = random.item(Object.keys(names) as SpeciesType[]);
  const classType = random.item(Object.keys(classData)) as ClassType;

  let player: Player = {
    name: generatePlayerName(random, species),
    species: species,
    class: classType,
    id: random.id(),
    teamId: null,
    perkIds: [],
    positions: forcedPosition ? [forcedPosition] : [],
    attributes: generateAttributes(random, species, classType),
  };
  const positions: Position[] = ['1b', '2b', '3b', 'ss', 'lf', 'cf', 'rf'];
  if (player.positions.length === 0) {
    player.positions.push(random.item(positions));
  }
  const extraPositions = forcedPosition === 'p' ? 0 : random.int(0, 2);
  for (let i = 0; i < extraPositions; i++) {
    const position = random.item(positions);
    if (!player.positions.includes(position)) {
      player.positions.push(position);
    }
  }

  const perkOptions = Object.keys(perks).filter((p) => {
    const perk = perks[p as keyof typeof perks];
    return (
      perk.kind === (forcedPosition === 'p' ? 'pitching' : 'batting') &&
      (!perk.requirements ||
        perk.requirements({ species, classType, positions }))
    );
  });

  player.perkIds.push(random.item(perkOptions));

  return player;
}

function generateAttributes(
  random: GameRandom,
  race: SpeciesType,
  classType: ClassType,
): Player['attributes'] {
  const pool = Array.from({ length: 8 }, (_, i) => i + 1)
    .map(() => random.int(1, 21))
    .sort((a, b) => a - b);
  const bestAttribute = classData[classType];
  const results = pool.slice(1, -1);
  const attributes = [
    bestAttribute,
    ...random
      .shuffle([
        'strength',
        'agility',
        'constitution',
        'wisdom',
        'intelligence',
        'charisma',
      ])
      .filter((i) => i !== bestAttribute),
  ];
  const attr = attributes.reduce((acc, key) => {
    acc[key as keyof typeof acc] = results.pop() ?? 0;
    return acc;
  }, {} as Player['attributes']);
  for (const [key, value] of Object.entries(speciesData[race])) {
    attr[key as keyof typeof attr] = Math.max(
      1,
      attr[key as keyof typeof attr] + value,
    );
  }
  return attr;
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

function generatePlayerName(random: GameRandom, race: SpeciesType): string {
  const { maleFirst, femaleFirst, last } = names[race];
  const firstName =
    random.int(0, 2) === 0 ? random.item(maleFirst) : random.item(femaleFirst);
  const lastName = random.item(last);
  return `${firstName} ${lastName}`;
}
