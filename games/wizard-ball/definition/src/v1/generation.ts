import { GameRandom } from '@long-game/game-definition';
import {
  BattingCompositeType,
  League,
  LeagueRound,
  PitchingCompositeType,
  Player,
  PlayerAttributes,
  Position,
  PositionChartKey,
  Team,
  TeamId,
} from './gameTypes';
import { names } from './names';
import { teamAdjectives, teamNouns } from './teamNames';
import { PrefixedId } from '@long-game/common';
import { speciesData, SpeciesType } from './speciesData';
import { classData, ClassType } from './classData';
import { perks } from './perkData';
import { getLevelFromXp, getPlayerOverall } from './attributes';
import { itemData } from './itemData';
import { canAssignToPosition, isPitcher } from './utils';
import { weather as weatherData, WeatherType } from './weatherData';
import { ballparkData, BallparkType } from './ballparkData';
import { applyXpAuto } from './boosts';

const battingCompositeTypes = [
  'extraBases',
  'hitAngle',
  'hitPower',
  'homeRuns',
  'contact',
  'stealing',
  'fielding',
  'durability',
  'plateDiscipline',
  'dueling',
] as const satisfies BattingCompositeType[];

const pitchingCompositeTypes = [
  'contact',
  'hitAngle',
  'movement',
  'strikeout',
  'accuracy',
  'hitPower',
  'velocity',
  'durability',
  'composure',
  'dueling',
] as const satisfies PitchingCompositeType[];

export function generateLeague(
  random: GameRandom,
  members: PrefixedId<'u'>[],
  options: {
    numTeams?: number;
    numPlayers?: number;
    numRounds?: number;
    skipPerks?: boolean;
  } = {},
): League {
  const playersPerTeam = options.numPlayers ?? 19;
  const roundCount = options.numRounds ?? 20;
  const teamCount = options.numTeams ?? 4;
  let league: League = {
    name: 'League name',
    teamIds: [],
    playerLookup: {},
    teamLookup: {},
    itemLookup: {},
    schedule: [],
    gameResults: [],
    currentWeek: 0,
  };

  const ballparks = random.shuffle(Object.keys(ballparkData)) as BallparkType[];
  // Generate teams
  const teams = Array.from({ length: teamCount }).map((_, idx) =>
    generateTeam(random, ballparks[idx]),
  );
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
    const attributes: Array<keyof PlayerAttributes> = [
      'strength',
      'agility',
      'constitution',
      'wisdom',
      'intelligence',
      'charisma',
    ];
    const plusAttributes = [random.item(attributes), random.item(attributes)];
    const minusAttributes = [random.item(attributes), random.item(attributes)];

    const forcedPositions: Position[] = [
      'c',
      '1b',
      '2b',
      '3b',
      'ss',
      'lf',
      'cf',
      'rf',
      'sp',
      'sp',
      'sp',
      'sp',
      'rp',
      'rp',
      'rp',
      'c',
      'if',
      'of',
    ];
    team.battingOrder = forcedPositions.slice(0, 9) as Team['battingOrder'];
    for (let i = 0; i < playersPerTeam; i++) {
      const player = generatePlayer(random, {
        position: forcedPositions[i],
        skipPerks: options.skipPerks,
      });
      plusAttributes.forEach((plusAttribute) => {
        player.attributes[plusAttribute] += 1;
      });

      minusAttributes.forEach((minusAttribute) => {
        player.attributes[minusAttribute] -= 1;
      });
      attributes.forEach((attribute) => {
        player.attributes[attribute] = Math.min(
          20,
          Math.max(1, player.attributes[attribute]),
        );
      });
      const position = player.positions[0];
      player.teamId = team.id;
      team.playerIds.push(player.id);
      if (
        !isPitcher(position) &&
        position !== 'if' &&
        position !== 'of' &&
        team.positionChart[position] === null
      ) {
        team.positionChart[position] = player.id;
      }
      if (forcedPositions[i] === 'sp') {
        team.pitchingOrder.push(player.id);
      }
      league.playerLookup[player.id] = player;
      league = applyXpAuto(random, player, league, random.int(0, 200));
    }

    // ensure pc plays good players and hase a sane batting order
    // for each bench player, swap them if they are better than the current player

    // TODO: Fix this!

    team.playerIds
      .map((playerId) => {
        const player = league.playerLookup[playerId];
        return player;
      })
      .filter(
        (player) =>
          player.positions.every((pos) => !isPitcher(pos)) &&
          !Object.values(team.positionChart).includes(player.id),
      )
      .forEach((player) => {
        if (player.positions.some((pos) => isPitcher(pos))) {
          // If the player is a pitcher, they should not be in the position chart
          return;
        }

        for (const pos of Object.keys(
          team.positionChart,
        ) as PositionChartKey[]) {
          if (
            canAssignToPosition(player.positions, pos) &&
            team.positionChart[pos] !== null
          ) {
            const currentPlayerId = team.positionChart[pos];
            const currentPlayer = league.playerLookup[currentPlayerId];
            if (getPlayerOverall(player) > getPlayerOverall(currentPlayer)) {
              team.positionChart[pos] = player.id;
              return;
            }
          }
        }
      });

    // sort batting order by overall
    team.battingOrder.sort((a, b) => {
      // sort pitcher last
      if (isPitcher(a) && !isPitcher(b)) return 1;
      if (isPitcher(b) && !isPitcher(a)) return -1;
      const playerA = team.positionChart[a as keyof typeof team.positionChart];
      const playerB = team.positionChart[b as keyof typeof team.positionChart];
      if (!playerA || !playerB) return 0;
      const overallA = getPlayerOverall(league.playerLookup[playerA]);
      const overallB = getPlayerOverall(league.playerLookup[playerB]);
      return overallB - overallA; // Sort in descending order
    });

    // sort pitching order by overall
    team.pitchingOrder.sort((a, b) => {
      const playerA = league.playerLookup[a];
      const playerB = league.playerLookup[b];
      const overallA = getPlayerOverall(playerA);
      const overallB = getPlayerOverall(playerB);
      return overallB - overallA; // Sort in descending order
    });

    // Generate a few items for each team
    for (let i = 0; i < 5; i++) {
      const { instanceId, ...item } = generateItem(random);
      league.itemLookup[instanceId] = { ...item, teamId: team.id };
      for (const player of random.shuffle(team.playerIds)) {
        const playerObj = league.playerLookup[player];
        const { level } = getLevelFromXp(playerObj.xp);
        const i = itemData[item.itemDef];
        if (
          !i.requirements ||
          i.requirements?.({
            species: playerObj.species,
            classType: playerObj.class,
            positions: playerObj.positions,
            attributes: playerObj.attributes,
            level,
          })
        ) {
          playerObj.itemIds.push(instanceId);
          break;
        }
      }
    }
  }

  // Generate schedule
  // This is a simple round-robin schedule
  const numTeams = league.teamIds.length;
  const teamIds = [...league.teamIds];
  if (numTeams % 2 !== 0) {
    teamIds.push('BYE' as TeamId); // Add a dummy team if odd number
  }
  const n = teamIds.length;
  for (let round = 0; round < roundCount; round++) {
    const roundGames: LeagueRound = [];
    for (let i = 0; i < n / 2; i++) {
      const team1 = teamIds[i];
      const team2 = teamIds[n - 1 - i];
      if (team1 !== 'BYE' && team2 !== 'BYE') {
        // Alternate home/away by round for balance
        if (round % 2 === 0) {
          const ballpark = league.teamLookup[team1].ballpark;
          const weatherTable = {
            ...Object.keys(weatherData).reduce(
              (acc, w) => ({ ...acc, [w]: 1 }),
              {},
            ),
            ...ballparkData[ballpark].weather,
          };
          const weather = random.table(weatherTable);
          roundGames.push({
            id: random.id(),
            homeTeamId: team1,
            awayTeamId: team2,
            weather,
            ballpark,
          });
        } else {
          const ballpark = league.teamLookup[team2].ballpark;
          const weatherTable = {
            ...Object.keys(weatherData).reduce(
              (acc, w) => ({ ...acc, [w]: 1 }),
              {},
            ),
            ...ballparkData[ballpark].weather,
          };
          const weather = random.table(weatherTable);
          roundGames.push({
            id: random.id(),
            homeTeamId: team2,
            awayTeamId: team1,
            weather,
            ballpark,
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

function generateTeam(random: GameRandom, ballpark: BallparkType): Team {
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
    runDifferential: 0,
    ballpark,
  };
  return team;
}

function generatePlayer(
  random: GameRandom,
  options: { position?: Position; skipPerks?: boolean } = {},
): Player {
  const { position: forcedPosition } = options;
  const species = random.item(Object.keys(names) as SpeciesType[]);
  const classType = random.item(Object.keys(classData)) as ClassType;

  const typeList =
    !forcedPosition || !isPitcher(forcedPosition)
      ? battingCompositeTypes
      : pitchingCompositeTypes;
  const shuffledTypes = random.shuffle([...typeList]);

  let player: Player = {
    name: generatePlayerName(random, species),
    species: species,
    class: classType,
    id: random.id(),
    teamId: null,
    perkIds: [],
    itemIds: [],
    positions: forcedPosition ? [forcedPosition] : [],
    attributes: generateAttributes(random, species, classType),
    stamina: 1,
    xp: 0,
    advantageTypes: [shuffledTypes[0]],
    disadvantageTypes: [shuffledTypes[1]],
    statusIds: {},
  };
  const positions: Position[] = [
    'c',
    '1b',
    '2b',
    '3b',
    'ss',
    'lf',
    'cf',
    'rf',
    'if',
    'of',
  ];
  if (player.positions.length === 0) {
    player.positions.push(random.item(positions));
  }
  const extraPositions =
    forcedPosition && isPitcher(forcedPosition) ? 0 : random.int(0, 2);
  for (let i = 0; i < extraPositions; i++) {
    const position = random.item(positions);
    if (!player.positions.includes(position)) {
      player.positions.push(position);
    }
  }
  if (player.positions.includes('if')) {
    player.positions = player.positions.filter(
      (p) => !['1b', '2b', '3b', 'ss'].includes(p),
    );
  }
  if (player.positions.includes('of')) {
    player.positions = player.positions.filter(
      (p) => !['lf', 'cf', 'rf'].includes(p),
    );
  }

  if (!options.skipPerks) {
    // const perkCount =
    //   random.float(0, 1) < 0.33 ? (random.float(0, 1) < 0.2 ? 3 : 2) : 1;
    const perkCount = random.float(0, 1) < 0.25 ? 1 : 0;
    const { level } = getLevelFromXp(player.xp);
    for (let i = 0; i < perkCount; i++) {
      const perkOptions = Object.keys(perks).filter((p) => {
        const perk = perks[p as keyof typeof perks];
        return (
          (perk.kind === 'any' ||
            perk.kind ===
              (forcedPosition && isPitcher(forcedPosition)
                ? 'pitching'
                : 'batting')) &&
          (!perk.requirements ||
            perk.requirements({
              species,
              classType,
              positions,
              attributes: player.attributes,
              level,
            })) &&
          !player.perkIds.includes(p)
        );
      });
      if (perkOptions.length === 0) continue;
      const chosenPerk = random.item(perkOptions);
      player.perkIds.push(chosenPerk);
    }
  }
  return player;
}

function generateAttributes(
  random: GameRandom,
  race: SpeciesType,
  classType: ClassType,
): Player['attributes'] {
  const pool = Array.from({ length: 8 }, (_, i) => i + 1)
    .map(() => random.int(3, 16))
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

export function pickRandomItemDef(random: GameRandom): string {
  const rarity = random.table({
    common: 16,
    uncommon: 8,
    rare: 4,
    epic: 2,
    legendary: 1,
  });

  return random.item(
    Object.entries(itemData)
      .filter(([, item]) => item.rarity === rarity)
      .map(([key]) => key),
  );
}

export function generateItem(
  random: GameRandom,
  itemDef?: string,
): {
  itemDef: string;
  instanceId: string;
} {
  return {
    itemDef: itemDef ?? pickRandomItemDef(random),
    instanceId: random.id(),
  };
}
