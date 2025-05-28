import { GameRandom } from '@long-game/game-definition';
import type {
  Base,
  GameLogEvent,
  GameResult,
  HitArea,
  HitPower,
  HitType,
  League,
  LeagueGame,
  LeagueGameState,
  LeagueRound,
  Player,
  PlayerId,
  PlayerStats,
  Position,
  RoundResult,
} from './gameTypes';
import {
  deepClone,
  multiplyObjects,
  scaleAttribute,
  scaleAttributePercent,
  sumObjects,
  valueByWeights,
} from './utils';
import { PitchData, ActualPitch, pitchTypes, PitchKind } from './pitchData';
import { Perk, perks } from './perkData';
import {
  getBattingCompositeRatings,
  getPitchingCompositeRatings,
} from './attributes';

export function simulateRound(
  random: GameRandom,
  league: League,
  round: LeagueRound,
): RoundResult {
  const results: RoundResult = [];
  for (const game of round) {
    const result = simulateGame(random, league, game);
    results.push(result);
  }
  return results;
}

function checkGameOver(
  gameState: LeagueGameState,
  leagueGame: LeagueGame,
): boolean {
  const homeScore = gameState.teamData[leagueGame.homeTeamId].score;
  const awayScore = gameState.teamData[leagueGame.awayTeamId].score;
  const battingScore =
    gameState.battingTeam === leagueGame.homeTeamId ? homeScore : awayScore;
  const pitchingScore =
    gameState.battingTeam === leagueGame.homeTeamId ? awayScore : homeScore;

  if (gameState.currentInning > 50) {
    return true;
  }
  if (gameState.currentInning >= 18 && battingScore > pitchingScore) {
    return true;
  }
  return false;
}

function simulateGame(
  random: GameRandom,
  league: League,
  game: LeagueGame,
): GameResult {
  let gameState = initialGameState();
  gameState.battingTeam = game.awayTeamId;
  gameState.pitchingTeam = game.homeTeamId;
  let awayPitcher: string = '',
    homePitcher: string = '';
  for (const teamId of [game.homeTeamId, game.awayTeamId]) {
    const team = league.teamLookup[teamId];
    const pitcher =
      team.pitchingOrder[team.nextPitcherIndex % team.pitchingOrder.length];
    if (teamId === game.awayTeamId) {
      awayPitcher = pitcher;
    } else {
      homePitcher = pitcher;
    }
    team.nextPitcherIndex =
      (team.nextPitcherIndex + 1) % team.pitchingOrder.length;
    gameState.teamData[teamId] = {
      score: 0,
      pitcher,
      battingOrder: team.battingOrder.map((pos) => {
        if (pos === 'p') {
          return pitcher;
        }
        if (!team.positionChart[pos]) {
          throw new Error(`No player for position ${pos}`);
        }
        return team.positionChart[pos];
      }),
    };
    gameState.currentBatterIndex[teamId] = 0;
  }
  while (!checkGameOver(gameState, game)) {
    gameState = simulateInning(random, gameState, league);
    if (checkGameOver(gameState, game)) {
      break;
    }
    gameState = endOfInning(gameState);
  }
  const homeScore = gameState.teamData[game.homeTeamId].score;
  const awayScore = gameState.teamData[game.awayTeamId].score;

  const winner = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
  const loser = homeScore > awayScore ? game.awayTeamId : game.homeTeamId;
  // Update W/L for pitchers
  gameState = addToPlayerStats(gameState, homePitcher, {
    wins: winner === game.homeTeamId ? 1 : 0,
    losses: winner === game.homeTeamId ? 0 : 1,
  });
  gameState = addToPlayerStats(gameState, awayPitcher, {
    wins: winner === game.awayTeamId ? 1 : 0,
    losses: winner === game.awayTeamId ? 0 : 1,
  });

  const score = {
    [game.homeTeamId]: homeScore,
    [game.awayTeamId]: awayScore,
  };
  return {
    winner,
    id: game.id,
    inningData: gameState.inningData,
    playerStats: gameState.playerStats,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    teamData: gameState.teamData,
    awayPitcher,
    homePitcher,
    loser,
    score,
    gameLog: gameState.gameLog,
  };
}

export type PitchOutcome =
  | 'ball'
  | 'strike'
  | 'hit'
  | 'out'
  | 'double'
  | 'triple'
  | 'homeRun'
  | 'foul';

function randomTable<T extends string>(
  random: GameRandom,
  table: Record<T, number>,
): T {
  const entries = Object.entries(table) as [T, number][];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const randomValue = random.int(0, totalWeight - 1);
  let cumulativeWeight = 0;
  for (const [value, weight] of entries) {
    cumulativeWeight += weight;
    if (randomValue < cumulativeWeight) {
      return value;
    }
  }
  return entries[entries.length - 1][0]; // Fallback
}

function initialGameState(): LeagueGameState {
  return {
    balls: 0,
    strikes: 0,
    outs: 0,
    bases: {
      1: null,
      2: null,
      3: null,
    },
    inningData: [],
    currentBatterIndex: {},
    currentInning: 1,
    battingTeam: '',
    pitchingTeam: '',
    teamData: {},
    playerStats: {},
    gameLog: [],
  };
}

function addToPlayerStats(
  gameState: LeagueGameState,
  playerId: string,
  stats: Partial<PlayerStats>,
): LeagueGameState {
  if (!gameState.playerStats[playerId]) {
    gameState.playerStats[playerId] = {
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      runsBattedIn: 0,
      runs: 0,
      walks: 0,
      strikeouts: 0,
      outsPitched: 0,
      earnedRuns: 0,
      ks: 0,
      pWalks: 0,
      hitsAllowed: 0,
      homeRunsAllowed: 0,
      stolenBases: 0,
      caughtStealing: 0,
      wins: 0,
      losses: 0,
    };
  }
  const playerStats = gameState.playerStats[playerId];
  for (const key of Object.keys(stats)) {
    // @ts-expect-error: dynamic key assignment
    playerStats[key] = (playerStats[key] || 0) + (stats[key] || 0);
  }
  return gameState;
}

export function addToGameLog(
  event: GameLogEvent,
  gameState: LeagueGameState,
): LeagueGameState {
  // DISABLE GAME LOGS FOR NOW
  return gameState;
  return { ...gameState, gameLog: [...gameState.gameLog, event] };
}

function resetCount(gameState: LeagueGameState): LeagueGameState {
  gameState.balls = 0;
  gameState.strikes = 0;
  return gameState;
}

function resetBases(gameState: LeagueGameState): LeagueGameState {
  gameState.bases[1] = null;
  gameState.bases[2] = null;
  gameState.bases[3] = null;
  return gameState;
}

function advanceRunnerForced(
  gameState: LeagueGameState,
  base: Base,
  sourcePlayerId: PlayerId,
  pitchingPlayerId: PlayerId,
): LeagueGameState {
  if (base < 1 || base > 3) {
    throw new Error('Base must be between 1 and 3');
  }
  const currentPlayerId = gameState.bases[base];
  if (currentPlayerId === null) {
    // No one on this base, so we can stop
    return gameState;
  }
  if (base === 3) {
    gameState.bases[base] = null;
    gameState = addToPlayerStats(gameState, sourcePlayerId, {
      runsBattedIn: 1,
    });
    gameState = addToPlayerStats(gameState, currentPlayerId, {
      runs: 1,
    });
    gameState = addToPlayerStats(gameState, pitchingPlayerId, {
      earnedRuns: 1,
    });
    gameState.teamData[gameState.battingTeam].score += 1;
    return gameState;
  }
  advanceRunnerForced(
    gameState,
    (base + 1) as Base,
    sourcePlayerId,
    pitchingPlayerId,
  );
  gameState.bases[(base + 1) as Base] = gameState.bases[base];
  gameState.bases[base] = null;

  return gameState;
}

function advanceAllRunners(
  gameState: LeagueGameState,
  sourcePlayerId: PlayerId,
  pitchingPlayerId: PlayerId,
  count: number = 1,
): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  if (count > 1) {
    gameState = advanceAllRunners(
      gameState,
      sourcePlayerId,
      pitchingPlayerId,
      count - 1,
    );
  }
  gameState = advanceRunnerForced(gameState, 3, currentBatter, currentPitcher);
  gameState = advanceRunnerForced(gameState, 2, currentBatter, currentPitcher);
  gameState = advanceRunnerForced(gameState, 1, currentBatter, currentPitcher);
  return gameState;
}

function incrementBatterIndex(
  gameState: LeagueGameState,
  teamId: string,
): LeagueGameState {
  gameState.currentBatterIndex[teamId] += 1;
  gameState.currentBatterIndex[teamId] %=
    gameState.teamData[teamId].battingOrder.length;
  return gameState;
}

function getCurrentBatter(gameState: LeagueGameState): string {
  return gameState.teamData[gameState.battingTeam].battingOrder[
    gameState.currentBatterIndex[gameState.battingTeam]
  ];
}

function getCurrentPitcher(gameState: LeagueGameState): string {
  return gameState.teamData[gameState.pitchingTeam].pitcher;
}

function getActivePlayerPerks(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
  pitchData?: ActualPitch,
): Perk[] {
  const { battingTeam, pitchingTeam } = gameState;
  const players = [
    ...gameState.teamData[battingTeam].battingOrder,
    ...gameState.teamData[pitchingTeam].battingOrder,
  ].map((pid) => league.playerLookup[pid]);
  return players.flatMap((player) =>
    player.perkIds
      .map((id) => perks[id as keyof typeof perks])
      .filter(Boolean)
      .filter(
        (p: Perk) =>
          !p.condition ||
          p.condition({
            pitchData,
            gameState,
            isMe: player.id === playerId,
            isBatter: player.id === getCurrentBatter(gameState),
            isPitcher: player.id === getCurrentPitcher(gameState),
            isRunner:
              gameState.bases[1] === player.id ||
              gameState.bases[2] === player.id ||
              gameState.bases[3] === player.id,
          }),
      ),
  );
}

function getModifiedAttributes(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
): Player['attributes'] {
  const clutchFactor = determineClutchFactor(gameState);
  const player = league.playerLookup[playerId];
  const stamina = Math.min(1, Math.max(0, player.stamina));
  const staminaFactor = (1 - stamina) * 10;
  const activePerks = getActivePlayerPerks(playerId, league, gameState);
  const baseStats = sumObjects(
    player.attributes,
    ...(activePerks
      .map((p) => p.effect().attributeBonus)
      .filter(Boolean) as Partial<Player['attributes']>[]),
    {
      strength: -staminaFactor,
      agility: -staminaFactor,
      constitution: -staminaFactor,
      wisdom: -staminaFactor,
      intelligence: -staminaFactor,
      charisma: -staminaFactor,
    },
  );
  return sumObjects(baseStats, {
    strength: clutchFactor * scaleAttribute(baseStats.charisma, 5),
    agility: clutchFactor * scaleAttribute(baseStats.charisma, 5),
    constitution: clutchFactor * scaleAttribute(baseStats.charisma, 5),
    wisdom: clutchFactor * scaleAttribute(baseStats.charisma, 5),
    intelligence: clutchFactor * scaleAttribute(baseStats.charisma, 5),
  });
}

function applyWalk(gameState: LeagueGameState): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  gameState = advanceRunnerForced(gameState, 1, currentBatter, currentPitcher);
  gameState.bases[1] = currentBatter;
  return gameState;
}

function applyHit(
  gameState: LeagueGameState,
  hitType: PitchOutcome,
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  switch (hitType) {
    case 'hit':
      gameState = advanceAllRunners(
        gameState,
        currentBatter,
        currentPitcher,
        1,
      );
      gameState.bases[1] = currentBatter;
      break;
    case 'double':
      gameState = advanceAllRunners(
        gameState,
        currentBatter,
        currentPitcher,
        2,
      );
      nextBases[2] = currentBatter;
      break;
    case 'triple':
      gameState = advanceAllRunners(
        gameState,
        currentBatter,
        currentPitcher,
        3,
      );
      nextBases[3] = currentBatter;
      break;
    case 'homeRun':
      gameState = advanceAllRunners(
        gameState,
        currentBatter,
        currentPitcher,
        3,
      );
      gameState.teamData[gameState.battingTeam].score += 1;
      break;
    default:
      break;
  }
  return gameState;
}

/** Return a number between 0 and 1 based on situation (increases for fuller counts, more runners in scoring position, late in the game, close score) */
function determineClutchFactor(gameState: LeagueGameState): number {
  // Count fullness: 0.0 (0-0) to 1.0 (3-2)
  const countFullness = (gameState.balls + gameState.strikes) / 5;

  const runnerOnThird = gameState.bases[3] !== null ? 1 : 0;
  const runnerOnSecond = gameState.bases[2] !== null ? 1 : 0;

  // Late in the game: 0 (early), 1 (half-inning 17+ which is 9th inning or later)
  // currentInning is 0-based and each full inning is 2 half-innings
  const fullInning = Math.floor(gameState.currentInning / 2) + 1;
  const lateGame = Math.min(1, (fullInning - 7) / 2);

  // Close score: 1 if tied, 0 if 5+ run difference
  const teamIds = Object.keys(gameState.teamData);
  if (teamIds.length < 2) return 0;
  const [teamA, teamB] = teamIds;
  const scoreDiff = Math.abs(
    gameState.teamData[teamA].score - gameState.teamData[teamB].score,
  );
  const closeScore = Math.max(0, 1 - scoreDiff / 5);

  // Weighted average (tweak weights as needed)
  const clutch =
    0.25 * countFullness +
    0.15 * runnerOnThird +
    0.1 * runnerOnSecond +
    0.25 * lateGame +
    0.25 * closeScore;

  return Math.max(0, Math.min(1, clutch));
}

function determineSwing(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  league: League,
  game: LeagueGameState,
  pitchData: PitchData,
): boolean {
  const batterComposite = getBattingCompositeRatings(
    getModifiedAttributes(batter.id, league, game),
  );
  const count = 10 + 4 * (2 * game.strikes - game.balls);
  const countWeight = 2 ** (batterComposite.plateDiscipline / 5) - 1;
  const swingModifier = scaleAttributePercent(
    valueByWeights([
      { value: count, weight: countWeight },

      // TODO: Decide how to handle this (used to be agility)
      // Maybe simplify a bit?
      {
        value: isStrike
          ? batterComposite.plateDiscipline
          : 20 - batterComposite.plateDiscipline,
        weight: 3,
      },
    ]),
    2,
  );
  let swingChance = isStrike
    ? 0.68 ** (1 / swingModifier)
    : 0.25 ** (1 / swingModifier);
  return random.float(0, 1) < swingChance;
}

function determineContact(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  league: League,
  gameState: LeagueGameState,
  pitchData: PitchData,
): boolean {
  const batterComposite = getBattingCompositeRatings(
    getModifiedAttributes(batter.id, league, gameState),
  );
  let contactChance = isStrike
    ? 0.85 * pitchData.contactStrikeFactor
    : 0.6 * pitchData.contactBallFactor;

  contactChance **= 1 / scaleAttributePercent(batterComposite.contact, 2);
  return random.float(0, 1) < contactChance;
}

type HitTable = Record<Exclude<PitchOutcome, 'ball' | 'strike'>, number>;

function multiplyHitTables(
  hitTableA: HitTable,
  hitTableB: Partial<HitTable>,
): HitTable {
  const result: HitTable = { ...hitTableA };
  for (const [key, value] of Object.entries(hitTableB)) {
    result[key as keyof HitTable] *= value;
  }
  return result;
}

function determinePitchType(
  random: GameRandom,
  batter: Player,
  pitcher: Player,
  game: LeagueGameState,
  league: League,
): ActualPitch {
  const pitchKind = random.item(Object.keys(pitchTypes) as PitchKind[]);
  const pitchData = deepClone(pitchTypes[pitchKind]) as ActualPitch;
  pitchData.kind = pitchKind;
  const activePerks = getActivePlayerPerks(pitcher.id, league, game, pitchData);
  const batterComposite = getBattingCompositeRatings(
    getModifiedAttributes(batter.id, league, game),
  );
  const pitcherComposite = getPitchingCompositeRatings(
    getModifiedAttributes(pitcher.id, league, game),
  );

  let attributeTotal = random.float(-5, 5);
  attributeTotal += 0.2 * (pitcherComposite.dueling - batterComposite.dueling);
  attributeTotal += 0.2 * (pitcherComposite.strikeout - 10) * game.strikes;
  attributeTotal +=
    (0.2 * (pitcherComposite.dependable - 10) * game.balls * 2) / 3;

  // switch (pitchKind) {
  //   case 'fastball':
  //     attributeTotal += strength;
  //   case 'curveball':
  //     attributeTotal += agility;
  //     break;
  //   case 'changeup':
  //     attributeTotal += wisdom;
  //     break;
  //   case 'slider':
  //     attributeTotal += intelligence;
  //     break;
  //   case 'sinker':
  //     attributeTotal += constitution;
  //     break;
  //   default:
  //     throw new Error(`Unknown pitch kind: ${pitchKind}`);
  // }
  activePerks.forEach((perk) => {
    const qb = perk.effect().qualityBonus;
    if (qb) {
      attributeTotal += qb;
    }
  });

  let quality = scaleAttributePercent(attributeTotal, 2.2);

  pitchData.quality = quality;

  // STR = strikeouts = more strikes, fewer swings at strikes
  // AGI = finesse = less contact
  // CON = higher counts, fewer swings in general
  // WIS = poor decisions, swing more at balls and less at strikes
  // INT = deception = higher pitch quality
  // CHA = higher pitch quality in clutch situations

  // TODO: Figure out how to handle modifying strikes
  pitchData.strikeFactor **=
    1 / scaleAttributePercent(pitcherComposite.accuracy, 1.5);

  pitchData.swingStrikeFactor **= 1 / quality;
  pitchData.swingBallFactor **= quality;
  pitchData.contactStrikeFactor **= 1 / quality;
  pitchData.contactBallFactor **= 1 / quality;
  Object.keys(pitchData.hitModiferTable.power).forEach((key) => {
    if (!key || !pitchData.hitModiferTable.power[key as HitPower]) {
      return;
    }
    pitchData.hitModiferTable.power[key as HitPower] =
      (pitchData.hitModiferTable.power[key as HitPower] ?? 1) ** quality;
  });
  Object.keys(pitchData.hitModiferTable.type).forEach((key) => {
    if (!key || !pitchData.hitModiferTable.type[key as HitType]) {
      return;
    }
    pitchData.hitModiferTable.type[key as HitType] =
      (pitchData.hitModiferTable.type[key as HitType] ?? 1) ** quality;
  });

  pitchData.swingBallFactor *= scaleAttributePercent(
    pitcherComposite.deception,
    1.5,
  );
  pitchData.hitModiferTable.type.grounder =
    (pitchData.hitModiferTable.type.grounder ?? 1) *
    scaleAttributePercent(pitcherComposite.hitAngle, 1.5);
  pitchData.hitModiferTable.power.strong =
    (pitchData.hitModiferTable.power.strong ?? 1) /
    scaleAttributePercent(pitcherComposite.hitPower, 1.5);
  pitchData.hitModiferTable.type.lineDrive =
    (pitchData.hitModiferTable.type.lineDrive ?? 1) /
    scaleAttributePercent(pitcherComposite.extraBases, 1.5);

  return pitchData;
}

function determineDefender(
  random: GameRandom,
  hitArea: HitArea,
  hitType: HitType,
): Exclude<Position, 'p'> {
  switch (hitType) {
    case 'grounder':
    case 'lineDrive':
      switch (hitArea) {
        case 'farLeft':
          return '3b';
        case 'left':
          return random.float() < 0.7 ? 'ss' : '3b';
        case 'center':
          return random.float() < 0.7 ? 'ss' : '2b';
        case 'right':
          return random.float() < 0.7 ? '2b' : '1b';
        case 'farRight':
          return '1b';
      }

    case 'popUp':
      return 'c';

    case 'fly':
      switch (hitArea) {
        case 'farLeft':
          return 'lf';
        case 'left':
          return random.float() < 0.7 ? 'cf' : 'lf';
        case 'center':
          return 'cf';
        case 'right':
          return random.float() < 0.7 ? 'cf' : 'rf';
        case 'farRight':
          return 'rf';
      }
  }
}

type HitResult = {
  hitArea: HitArea;
  hitPower: HitPower;
  hitType: HitType;
  defender: Exclude<Position, 'p'> | null;
  defenderId: PlayerId | null;
  outcome: PitchOutcome;
};

function determineHitResult(
  random: GameRandom,
  pitchData: ActualPitch,
  isStrike: boolean,
  gameState: LeagueGameState,
  league: League,
): HitResult {
  const batter = getCurrentBatter(gameState);
  const activePerks = getActivePlayerPerks(
    batter,
    league,
    gameState,
    pitchData,
  );
  activePerks.forEach((perk) => {
    const h = perk.effect().hitModiferTable;
    if (h?.power)
      pitchData.hitModiferTable.power = multiplyObjects(
        pitchData.hitModiferTable.power,
        h.power,
      );

    if (h?.type) {
      pitchData.hitModiferTable.type = multiplyObjects(
        pitchData.hitModiferTable.type,
        h.type,
      );
    }
  });
  const batterAttributes = getModifiedAttributes(batter, league, gameState);
  const batterCompositeRatings = getBattingCompositeRatings(batterAttributes);
  const hitAreaTable: Record<HitArea, number> = {
    farLeft: 0.5,
    left: 1.5,
    center: 2,
    right: 1.5,
    farRight: 0.5,
  };
  const hitArea = randomTable(random, hitAreaTable);
  const hitPowerTable: Record<HitPower, number> = multiplyObjects(
    isStrike
      ? {
          weak: 1,
          normal: 3,
          strong: 2 * scaleAttributePercent(batterCompositeRatings.hitPower, 2),
        }
      : {
          weak: 2,
          normal: 1,
          strong:
            0.5 * scaleAttributePercent(batterCompositeRatings.hitPower, 2),
        },
    pitchData.hitModiferTable.power,
  );
  const hitPower = randomTable(random, hitPowerTable);
  const hitTypeTable: Record<HitType, number> = multiplyObjects(
    isStrike
      ? {
          grounder: 4,
          fly: 2 * scaleAttributePercent(batterCompositeRatings.hitAngle, 1.5),
          lineDrive:
            2.5 * scaleAttributePercent(batterCompositeRatings.hitAngle, 1.5),
          popUp: 1,
        }
      : {
          grounder: 1,
          fly: 3 * scaleAttributePercent(batterCompositeRatings.hitAngle, 1.5),
          lineDrive:
            2 * scaleAttributePercent(batterCompositeRatings.hitAngle, 1.5),
          popUp: 4,
        },
    pitchData.hitModiferTable.type,
  );
  const hitType = randomTable(random, hitTypeTable);

  // Determine defender based on hit direction and type
  const defender = determineDefender(random, hitArea, hitType);
  const defendingPlayerId =
    league.teamLookup[gameState.pitchingTeam].positionChart[defender];
  if (!defendingPlayerId) {
    throw new Error(`No player found for defender position: ${defender}`);
  }
  const defenderComposite = getBattingCompositeRatings(
    getModifiedAttributes(defendingPlayerId, league, gameState),
  );
  const defenseModifer = scaleAttributePercent(defenderComposite.fielding, 2);
  let baseHitTable: Partial<HitTable> = {};
  let outChance = 0.5;
  if (hitType === 'grounder') {
    if (hitPower === 'weak') {
      baseHitTable = {
        hit: 1,
        out: 9,
      };
    } else if (hitPower === 'normal') {
      baseHitTable = {
        hit: 1,
        out: 3,
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        double:
          0.2 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        hit: 3,
        out: 5,
        triple:
          0.1 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
      };
    }
  } else if (hitType === 'fly') {
    if (hitPower === 'weak') {
      baseHitTable = {
        hit: 1,
        out: 20,
      };
    } else if (hitPower === 'normal') {
      baseHitTable = {
        hit: 2,
        double: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        out: 15,
        triple:
          0.2 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        homeRun:
          0.1 * scaleAttributePercent(batterCompositeRatings.homeRuns, 2),
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        hit: 0.5,
        double: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        out: 2,
        triple:
          0.4 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        homeRun: 6 * scaleAttributePercent(batterCompositeRatings.homeRuns, 2),
      };
    }
  } else if (hitType === 'lineDrive') {
    if (hitPower === 'weak') {
      baseHitTable = {
        hit: 2,
        out: 1,
      };
    } else if (hitPower === 'normal') {
      baseHitTable = {
        hit: 4,
        out: 1,
        double:
          0.5 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        triple:
          0.2 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        hit: 8,
        double: 2 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        out: 1,
        triple: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        homeRun:
          0.5 * scaleAttributePercent(batterCompositeRatings.homeRuns, 2),
      };
    }
  } else if (hitType === 'popUp') {
    baseHitTable = {
      hit: 1,
      out: 99,
    };
  }

  let hitTable: HitTable = {
    hit: 0,
    out: 0,
    double: 0,
    triple: 0,
    homeRun: 0,
    foul: 0,
    ...baseHitTable,
  };
  hitTable = multiplyHitTables(hitTable, { out: defenseModifer });
  for (const perk of activePerks) {
    const h = perk.effect().hitTableFactor;
    if (h) {
      hitTable = multiplyHitTables(hitTable, h);
    }
  }

  const result = randomTable(random, hitTable) as PitchOutcome;
  return {
    hitArea,
    hitPower,
    hitType,
    defender,
    defenderId: defendingPlayerId,
    outcome: result,
  };
}

function attemptSteal(
  random: GameRandom,
  gameState: LeagueGameState,
  fromBase: Base,
  league: League,
): LeagueGameState {
  const playerId = gameState.bases[fromBase];
  if (!playerId) {
    return gameState;
  }
  const catcherId = league.teamLookup[gameState.pitchingTeam].positionChart.c;
  if (!catcherId) {
    throw new Error('No catcher found for steal attempt');
  }
  const defenderComposite = getBattingCompositeRatings(
    getModifiedAttributes(catcherId, league, gameState),
  );
  const batterComposite = getBattingCompositeRatings(
    getModifiedAttributes(playerId, league, gameState),
  );
  const agilityFactor = scaleAttributePercent(
    batterComposite.stealing + (10 - defenderComposite.fielding) / 4,
    2,
  );
  const stealSuccessChance =
    (fromBase === 2 ? 0.8 : 0.75) ** (1 / agilityFactor);
  if (random.float(0, 1) < stealSuccessChance) {
    gameState.bases[fromBase] = null;
    if (fromBase === 3) {
      gameState.teamData[gameState.battingTeam].score += 1;
      gameState = addToPlayerStats(gameState, playerId, {
        runs: 1,
      });
    } else {
      gameState.bases[(fromBase + 1) as Base] = playerId;
    }
    gameState = addToPlayerStats(gameState, playerId, {
      stolenBases: 1,
    });
  } else {
    gameState = addToPlayerStats(gameState, playerId, {
      caughtStealing: 1,
    });
    gameState.outs += 1;
  }
  return gameState;
}

function determineSteal(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const catcherId = league.teamLookup[gameState.pitchingTeam].positionChart.c;
  if (!catcherId) {
    throw new Error('No catcher found for steal attempt');
  }
  const catcherComposite = getBattingCompositeRatings(
    getModifiedAttributes(catcherId, league, gameState),
  );
  const playerOnFirst = gameState.bases[1];
  const playerOnSecond = gameState.bases[2];
  const playerOnThird = gameState.bases[3];
  if (playerOnFirst !== null && playerOnSecond === null) {
    const runnerComposite = getBattingCompositeRatings(
      getModifiedAttributes(playerOnFirst, league, gameState),
    );
    const agilityFactor = scaleAttributePercent(
      runnerComposite.stealing + (10 - catcherComposite.fielding) / 4,
      20,
    );
    const stealAttemptChance = 0.01 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 1, league);
    }
  }
  if (playerOnSecond !== null && playerOnThird === null) {
    const runnerComposite = getBattingCompositeRatings(
      getModifiedAttributes(playerOnSecond, league, gameState),
    );
    const agilityFactor = scaleAttributePercent(
      runnerComposite.stealing + (10 - catcherComposite.fielding) / 4,
      20,
    );
    const stealAttemptChance = 0.004 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 2, league);
    }
  }
  // TODO: Implement stealing home
  return gameState;
}

function simulatePitch(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const batterId = getCurrentBatter(gameState);
  const batter = league.playerLookup[batterId];
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  let nextBatter = false;

  const pitchData = determinePitchType(
    random,
    batter,
    pitcher,
    gameState,
    league,
  );
  const baseStrikeChanceTable: Record<number, Record<number, number>> = {
    0: {
      0: 0.62,
      1: 0.6,
      2: 0.58,
      3: 0.54,
    },
    1: {
      0: 0.64,
      1: 0.63,
      2: 0.61,
      3: 0.57,
    },
    2: {
      0: 0.66,
      1: 0.65,
      2: 0.63,
      3: 0.61,
    },
  };
  const baseStrikeChance =
    baseStrikeChanceTable[gameState.strikes]?.[gameState.balls] ?? 0.6;
  const strikeChance = baseStrikeChance * pitchData.strikeFactor;

  // Determine whether the pitch is a ball or strike
  const isStrike = random.float(0, 1) < strikeChance;

  // Determine the outcome of the pitch
  let outcome: PitchOutcome;
  let hitResult: HitResult | null = null;
  const batterSwung = determineSwing(
    random,
    isStrike,
    batter,
    league,
    gameState,
    pitchData,
  );
  if (!batterSwung) {
    outcome = isStrike ? 'strike' : 'ball';
  } else {
    const contactMade = determineContact(
      random,
      isStrike,
      batter,
      league,
      gameState,
      pitchData,
    );
    if (contactMade) {
      hitResult = determineHitResult(
        random,
        pitchData,
        isStrike,
        gameState,
        league,
      );
      outcome = hitResult.outcome;
    } else {
      outcome = 'strike';
    }
  }

  // Update the game state based on the outcome
  switch (outcome) {
    case 'ball':
      // Increment ball count
      gameState.balls += 1;
      if (gameState.balls >= 4) {
        gameState = applyWalk(gameState);
        gameState = addToPlayerStats(gameState, batterId, {
          walks: 1,
        });
        gameState = addToPlayerStats(gameState, pitcherId, {
          pWalks: 1,
        });
        gameState = addToGameLog(
          { kind: 'walk', batterId, pitcherId },
          gameState,
        );
        nextBatter = true;
      } else {
        gameState = addToGameLog(
          {
            kind: 'ball',
            batterId,
            pitcherId,
            strikes: gameState.strikes,
            balls: gameState.balls,
          },
          gameState,
        );
        gameState = determineSteal(random, gameState, league);
      }
      break;
    case 'strike':
      // Increment strike count
      gameState.strikes += 1;
      if (gameState.strikes >= 3) {
        // Strikeout
        gameState = addToPlayerStats(gameState, batterId, {
          atBats: 1,
          strikeouts: 1,
        });
        gameState = addToPlayerStats(gameState, pitcherId, {
          ks: 1,
          outsPitched: 1,
        });
        gameState = addToGameLog(
          { kind: 'strikeout', batterId, pitcherId },
          gameState,
        );
        nextBatter = true;
        gameState.outs += 1;
      } else {
        gameState = addToGameLog(
          {
            kind: 'strike',
            batterId,
            pitcherId,
            strikes: gameState.strikes,
            balls: gameState.balls,
          },
          gameState,
        );
        gameState = determineSteal(random, gameState, league);
      }
      break;
    case 'foul':
      // Increment foul count
      if (gameState.strikes < 2) {
        gameState.strikes += 1;
      }
      gameState = addToGameLog(
        {
          kind: 'foul',
          batterId,
          pitcherId,
          strikes: gameState.strikes,
          balls: gameState.balls,
        },
        gameState,
      );
      break;
    case 'out':
      // Check for sacrifice fly
      if (hitResult?.hitType === 'fly' && hitResult?.hitPower !== 'weak') {
        gameState = advanceRunnerForced(gameState, 3, batterId, pitcherId);
        if (hitResult.hitPower === 'strong') {
          gameState = advanceRunnerForced(gameState, 2, batterId, pitcherId);
        }
      }
      // TODO: Handle sacrifice hits
      // Increment out count
      gameState.outs += 1;
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1 });
      gameState = addToPlayerStats(gameState, pitcherId, {
        outsPitched: 1,
      });
      if (!hitResult) {
        throw new Error('Hit result is undefined');
      }
      gameState = addToGameLog(
        {
          kind: 'out',
          batterId,
          pitcherId,
          type: hitResult.hitType,
          direction: hitResult.hitArea,
          power: hitResult.hitPower,
          defender: hitResult.defender,
          defenderId: hitResult.defenderId,
        },
        gameState,
      );
      nextBatter = true;
      break;
    case 'hit':
    case 'double':
    case 'triple':
    case 'homeRun':
      // Apply hit to the game state
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1, hits: 1 });
      gameState = addToPlayerStats(gameState, pitcherId, {
        hitsAllowed: 1,
      });
      if (!hitResult) {
        throw new Error('Hit result is undefined');
      }
      gameState = addToGameLog(
        {
          kind: outcome,
          batterId,
          pitcherId,
          type: hitResult.hitType,
          direction: hitResult.hitArea,
          power: hitResult.hitPower,
          defender: hitResult.defender,
          defenderId: hitResult.defenderId,
        },
        gameState,
      );
      if (outcome === 'double') {
        gameState = addToPlayerStats(gameState, batterId, { doubles: 1 });
      } else if (outcome === 'triple') {
        gameState = addToPlayerStats(gameState, batterId, { triples: 1 });
      } else if (outcome === 'homeRun') {
        gameState = addToPlayerStats(gameState, batterId, {
          homeRuns: 1,
          runsBattedIn: 1,
          runs: 1,
        });
        gameState = addToPlayerStats(gameState, pitcherId, {
          homeRunsAllowed: 1,
          earnedRuns: 1,
        });
      }
      gameState = applyHit(gameState, outcome);
      nextBatter = true;
      break;
  }

  // Adjust pitching stamina
  const pitcherComposite = getPitchingCompositeRatings(
    getModifiedAttributes(pitcherId, league, gameState),
  );
  const batterComposite = getBattingCompositeRatings(
    getModifiedAttributes(batter.id, league, gameState),
  );
  pitcher.stamina = Math.max(
    -0.25,
    pitcher.stamina +
      scaleAttributePercent(pitcherComposite.durability, 1.005) -
      1.015,
  );
  batter.stamina = Math.max(
    -0.25,
    batter.stamina +
      scaleAttributePercent(batterComposite.durability, 1.005) -
      1.015,
  );

  if (nextBatter) {
    gameState = incrementBatterIndex(gameState, gameState.battingTeam);
    gameState = resetCount(gameState);
  }

  return gameState;
}

function simulateInning(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const initialScore = gameState.teamData[gameState.battingTeam].score;
  gameState = addToGameLog(
    {
      kind: 'inningStart',
      battingTeam: gameState.battingTeam,
      pitchingTeam: gameState.pitchingTeam,
      inning: gameState.currentInning,
      score: {
        [gameState.battingTeam]:
          gameState.teamData[gameState.battingTeam].score,
        [gameState.pitchingTeam]:
          gameState.teamData[gameState.pitchingTeam].score,
      },
    },
    gameState,
  );
  while (gameState.outs < 3) {
    gameState = simulatePitch(random, gameState, league);
  }
  const nextScore = gameState.teamData[gameState.battingTeam].score;
  gameState.inningData.push({
    runs: nextScore - initialScore,
    battingTeam: gameState.battingTeam,
    pitchingTeam: gameState.pitchingTeam,
  });

  return gameState;
}

function endOfInning(gameState: LeagueGameState): LeagueGameState {
  // Switch teams
  const temp = gameState.battingTeam;
  gameState.battingTeam = gameState.pitchingTeam;
  gameState.pitchingTeam = temp;
  gameState.outs = 0;
  gameState = resetCount(gameState);
  gameState = resetBases(gameState);
  gameState.currentInning += 1;
  return gameState;
}
