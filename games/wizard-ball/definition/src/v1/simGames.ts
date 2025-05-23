import { GameRandom } from '@long-game/game-definition';
import type {
  Base,
  GameResult,
  League,
  LeagueGame,
  LeagueGameState,
  LeagueRound,
  Player,
  PlayerId,
  PlayerStats,
  RoundResult,
} from './gameTypes';
import {
  deepClone,
  scaleAttributePercent,
  valueByWeights,
  WeightedValue,
} from './utils';
import { PitchData, ActualPitch, pitchTypes, PitchKind } from './pitchData';
import { Perk, perks } from './perkData';

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
  for (const teamId of [game.homeTeamId, game.awayTeamId]) {
    const team = league.teamLookup[teamId];
    const pitcher =
      team.pitchingOrder[team.nextPitcherIndex % team.pitchingOrder.length];
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
  }
  const homeScore = gameState.teamData[game.homeTeamId].score;
  const awayScore = gameState.teamData[game.awayTeamId].score;

  const winner = homeScore > awayScore ? game.homeTeamId : game.awayTeamId;
  const loser = homeScore > awayScore ? game.awayTeamId : game.homeTeamId;
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
    loser,
    score,
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
    };
  }
  const playerStats = gameState.playerStats[playerId];
  for (const key of Object.keys(stats)) {
    // @ts-expect-error: dynamic key assignment
    playerStats[key] = (playerStats[key] || 0) + (stats[key] || 0);
  }
  return gameState;
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
  player: Player,
  gameState: LeagueGameState,
): Perk[] {
  return player.perkIds
    .map((id) => perks[id as keyof typeof perks])
    .filter(Boolean)
    .filter(
      (p: Perk) =>
        (p.kind === 'batting' && player.id === getCurrentBatter(gameState)) ||
        (p.kind === 'pitching' && player.id === getCurrentPitcher(gameState)),
    )
    .filter(
      (p: Perk) =>
        !p.condition ||
        p.condition({
          gameState,
        }),
    );
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

function runnersInScoringPosition(gameState: LeagueGameState): number {
  let runners = 0;
  if (gameState.bases[2] !== null) {
    runners += 1;
  }
  if (gameState.bases[3] !== null) {
    runners += 1;
  }
  return runners;
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
  game: LeagueGameState,
  pitchData: PitchData,
): boolean {
  const { wisdom, agility } = batter.attributes;
  const countFactor = scaleAttributePercent(
    wisdom + 5,
    (game.strikes * 1.5 - game.balls) * 1.1,
  );
  let swingChance = isStrike
    ? 0.68 * pitchData.swingStrikeFactor
    : 0.25 * pitchData.swingBallFactor;
  const agilityModifier = scaleAttributePercent(
    agility,
    isStrike ? 1.1 : 1 / 1.1,
  );
  swingChance *= agilityModifier * countFactor;
  return random.float(0, 1) < swingChance;
}

function determineContact(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  gameState: LeagueGameState,
  pitchData: PitchData,
): boolean {
  const { intelligence, constitution } = batter.attributes;
  let contactChance = isStrike
    ? 0.85 * pitchData.contactStrikeFactor
    : 0.6 * pitchData.contactBallFactor;
  const constitutionModifier = scaleAttributePercent(constitution, 1.1);

  const countFactor = gameState.strikes / 2;
  const intelligenceModifier = scaleAttributePercent(
    intelligence,
    1.2 * countFactor,
  );
  contactChance *= constitutionModifier * intelligenceModifier;
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

function determineHitTable(
  isStrike: boolean,
  batter: Player,
  gameState: LeagueGameState,
  league: League,
  pitchData: PitchData,
): HitTable {
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  const { strength, agility, charisma, constitution } = batter.attributes;
  const clutchFactor = determineClutchFactor(gameState);
  const constitutionModifier = scaleAttributePercent(constitution, 1.1);
  const strengthModifier = scaleAttributePercent(strength, 1.1);
  const agilityModifier = scaleAttributePercent(agility, 1.1);
  const charismaModifier = scaleAttributePercent(
    charisma,
    Math.pow(1.4, clutchFactor),
  );

  let hitTable: HitTable = isStrike
    ? {
        hit: 15 * (agilityModifier * charismaModifier),
        double: 5 * (strengthModifier * charismaModifier),
        triple: 1 * (strengthModifier * agilityModifier * charismaModifier),
        homeRun: 4 * (scaleAttributePercent(strength, 1.4) * charismaModifier),
        foul: 15,
        out: 60 / constitutionModifier,
      }
    : {
        hit: 8 * agilityModifier,
        double: 2 * strengthModifier,
        triple: 0.2 * (strengthModifier * agilityModifier),
        homeRun: 1 * scaleAttributePercent(strength, 1.4),
        foul: 15,
        out: 75 / constitutionModifier,
      };

  hitTable = multiplyHitTables(hitTable, pitchData.hitTableFactor);
  // apply skill hit tables
  const activePerks = [
    ...getActivePlayerPerks(batter, gameState),
    ...getActivePlayerPerks(pitcher, gameState),
  ];
  for (const perk of activePerks) {
    if (perk.hitTableFactor) {
      hitTable = multiplyHitTables(hitTable, perk.hitTableFactor);
    }
  }
  return hitTable;
}

function determinePitchType(
  random: GameRandom,
  pitcher: Player,
  game: LeagueGameState,
): ActualPitch {
  const clutchFactor = determineClutchFactor(game);
  const pitchKind = random.item(Object.keys(pitchTypes) as PitchKind[]);
  const pitchData = deepClone(pitchTypes[pitchKind]) as ActualPitch;
  pitchData.kind = pitchKind;
  const { strength, agility, constitution, wisdom, intelligence, charisma } =
    pitcher.attributes;
  const strengthFactor = scaleAttributePercent(strength, 1.1);
  const agilityFactor = scaleAttributePercent(agility, 1.1);
  const constitutionFactor = scaleAttributePercent(constitution, 1.1);
  const wisdomFactor = scaleAttributePercent(wisdom, 1.1);
  const intelligenceFactor = scaleAttributePercent(intelligence, 1.1);
  const charismaFactor = scaleAttributePercent(
    charisma,
    Math.pow(1.4, clutchFactor),
  );

  const baseRoll = random.float(1, 21);
  const statWeight = 4;

  let weightedValues: WeightedValue[] = [
    {
      value: baseRoll,
      weight: 1,
    },
  ];
  switch (pitchKind) {
    case 'fastball':
      weightedValues.push({
        value: strength,
        weight: statWeight,
      });
    case 'curveball':
      weightedValues.push({
        value: agility,
        weight: statWeight,
      });
      break;
    case 'changeup':
      weightedValues.push({
        value: wisdom,
        weight: statWeight,
      });
      break;
    case 'slider':
      weightedValues.push({
        value: intelligence,
        weight: statWeight,
      });
      break;
    case 'sinker':
      weightedValues.push({
        value: constitution,
        weight: statWeight,
      });
      break;
    default:
      throw new Error(`Unknown pitch kind: ${pitchKind}`);
  }

  let quality = scaleAttributePercent(valueByWeights(weightedValues), 1.4);
  quality *=
    scaleAttributePercent(intelligence, 1.05) *
    scaleAttributePercent(charisma, Math.pow(1.4, clutchFactor));
  pitchData.quality = quality;

  // STR = strikeouts = more strikes, fewer swings at strikes
  // AGI = finesse = less contact
  // CON = higher counts, fewer swings in general
  // WIS = poor decisions, swing more at balls and less at strikes
  // INT = deception = higher pitch quality
  // CHA = higher pitch quality in clutch situations

  pitchData.strikeFactor *= agilityFactor * constitutionFactor;

  pitchData.swingStrikeFactor *= 1 / strengthFactor / constitutionFactor;
  pitchData.swingBallFactor *= wisdomFactor / constitutionFactor;
  pitchData.contactStrikeFactor *= 1 / agilityFactor / strengthFactor;
  pitchData.contactBallFactor *= wisdomFactor / agilityFactor;

  pitchData.strikeFactor *= quality;
  pitchData.swingStrikeFactor *= 1 / quality;
  pitchData.swingBallFactor *= quality;
  pitchData.contactStrikeFactor *= 1 / quality;
  pitchData.contactBallFactor *= 1 / quality;
  Object.keys(pitchData.hitTableFactor).forEach((key) => {
    const value = pitchData.hitTableFactor[key as keyof HitTable] || 1;
    pitchData.hitTableFactor[key as keyof HitTable] = value ** quality;
  });
  // console.log({
  //   pitchData,
  //   baseQuality,
  //   quality,
  //   agilityFactor,
  //   constitutionFactor,
  //   strengthFactor,
  //   wisdomFactor,
  //   intelligenceFactor,
  //   charismaFactor,
  //   clutchFactor,
  // });

  return pitchData;
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
  const player = league.playerLookup[playerId];
  const agilityFactor = scaleAttributePercent(player.attributes.agility, 1.2);
  const stealSuccessChance = (fromBase === 2 ? 0.8 : 0.75) * agilityFactor;
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
  const playerOnFirst = gameState.bases[1];
  const playerOnSecond = gameState.bases[2];
  const playerOnThird = gameState.bases[3];
  if (playerOnFirst !== null && playerOnSecond === null) {
    const agilityFactor = scaleAttributePercent(
      league.playerLookup[playerOnFirst].attributes.agility,
      20,
    );
    const stealAttemptChance = 0.01 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 1, league);
    }
  }
  if (playerOnSecond !== null && playerOnThird === null) {
    const agilityFactor = scaleAttributePercent(
      league.playerLookup[playerOnSecond].attributes.agility,
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

  const pitchData = determinePitchType(random, pitcher, gameState);
  const strikeChance = 0.7 * pitchData.strikeFactor;

  // Determine whether the pitch is a ball or strike
  const isStrike = random.float(0, 1) < strikeChance;

  // Determine the outcome of the pitch
  let outcome: PitchOutcome;
  const batterSwung = determineSwing(
    random,
    isStrike,
    batter,
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
      gameState,
      pitchData,
    );
    if (contactMade) {
      outcome = randomTable(
        random,
        determineHitTable(isStrike, batter, gameState, league, pitchData),
      );
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
        gameState = incrementBatterIndex(gameState, gameState.battingTeam);
        gameState = resetCount(gameState);
      } else {
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
        gameState = incrementBatterIndex(gameState, gameState.battingTeam);
        gameState = resetCount(gameState);
        gameState.outs += 1;
      } else {
        gameState = determineSteal(random, gameState, league);
      }
      break;
    case 'foul':
      // Increment foul count
      if (gameState.strikes < 2) {
        gameState.strikes += 1;
      }
      break;
    case 'out':
      // Increment out count
      gameState.outs += 1;
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1 });
      gameState = addToPlayerStats(gameState, pitcherId, {
        outsPitched: 1,
      });
      gameState = incrementBatterIndex(gameState, gameState.battingTeam);
      gameState = resetCount(gameState);
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
      gameState = incrementBatterIndex(gameState, gameState.battingTeam);
      gameState = resetCount(gameState);
      break;
  }

  return gameState;
}

function simulateInning(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const initialScore = gameState.teamData[gameState.battingTeam].score;
  while (gameState.outs < 3) {
    gameState = simulatePitch(random, gameState, league);
  }
  const nextScore = gameState.teamData[gameState.battingTeam].score;
  gameState.inningData.push({
    runs: nextScore - initialScore,
    battingTeam: gameState.battingTeam,
    pitchingTeam: gameState.pitchingTeam,
  });
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
