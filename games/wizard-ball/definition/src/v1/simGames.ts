import { GameRandom } from '@long-game/game-definition';
import type {
  AtBatOutcome,
  Base,
  BattingCompositeRatings,
  GameResult,
  HitArea,
  HitPower,
  HitTable,
  HitType,
  League,
  LeagueGame,
  LeagueGameState,
  LeagueRound,
  LogsPitchData,
  PitchingCompositeRatings,
  PitchOutcome,
  Player,
  PlayerId,
  PlayerStats,
  Position,
  PositionChart,
  PositionChartKey,
  RoundResult,
} from './gameTypes';
import {
  getInningInfo,
  isPitcher,
  last,
  multiplyObjects,
  scaleAttribute,
  scaleAttributePercent,
  sum,
  sumObjects,
} from './utils';
import { ActualPitch, pitchTypes, PitchKind } from './pitchData';
import { Perk, PerkEffect, perks } from './perkData';
import {
  getBattingCompositeRatings,
  getPitchingCompositeRatings,
  getPlayerOverall,
} from './attributes';
import Logger from './logger';
import { Weather, weather as weatherData } from './weatherData';
import { Ballpark, ballparkData } from './ballparkData';
import { Status, statusData, StatusType } from './statusData';

const logger = new Logger('state');
// const logger = new Logger('console');

export function simulateRound(
  random: GameRandom,
  league: League,
  round: LeagueRound,
): RoundResult {
  const results: RoundResult = [];
  for (const game of round) {
    // Hack - ensure that only the most recent round gets the game logs
    league.gameResults = league.gameResults.map((r) =>
      r.map(({ gameLog, ...g }) => g),
    );
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
  // TODO: Fix this to handle home vs away properly
  if (gameState.currentInning >= 18 && battingScore > pitchingScore) {
    return true;
  }
  return false;
}

export function setupGame(
  league: League,
  game: LeagueGame,
  gameState: LeagueGameState = initialGameState(game),
) {
  gameState.weather = game.weather;
  gameState.ballpark = game.ballpark;
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
      pitchers: [pitcher],
      battingOrder: team.battingOrder.map((pos) => {
        if (isPitcher(pos)) {
          return pitcher;
        }
        if (!team.positionChart[pos as PositionChartKey]) {
          throw new Error(
            `No player for position ${pos} ${JSON.stringify(
              team.positionChart,
            )}`,
          );
        }
        return team.positionChart[pos as PositionChartKey]!;
      }),
    };
    gameState.currentBatterIndex[teamId] = 0;
  }
  return gameState;
}

export function simulateGame(
  random: GameRandom,
  league: League,
  game: LeagueGame,
): GameResult {
  let gameState = initialGameState(game);
  gameState = setupGame(league, game, gameState);
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
  if (gameState.winningPitcherId) {
    gameState = addToPlayerStats(gameState, gameState.winningPitcherId, {
      wins: 1,
    });
  }
  if (gameState.losingPitcherId) {
    gameState = addToPlayerStats(gameState, gameState.losingPitcherId, {
      losses: 1,
    });
  }
  const lastPitcherForWinner = last(gameState.teamData[winner].pitchers);
  if (
    lastPitcherForWinner &&
    (gameState.playerStats[lastPitcherForWinner]?.outsPitched ?? 0) >= 9
  ) {
    gameState.saveElligiblePitcherId = lastPitcherForWinner;
  }
  if (
    gameState.saveElligiblePitcherId &&
    gameState.saveElligiblePitcherId !== gameState.winningPitcherId
  ) {
    gameState = addToPlayerStats(gameState, gameState.saveElligiblePitcherId, {
      saves: 1,
    });
  }

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
    gameLog: gameState.gameLog,
    weather: gameState.weather,
    ballpark: gameState.ballpark,
  };
}

function randomByWeight<T>(
  random: GameRandom,
  weights: Array<{ value: T; weight: number }>,
): T {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const randomValue = random.float(0, totalWeight);
  let cumulativeWeight = 0;
  for (const { value, weight } of weights) {
    cumulativeWeight += weight;
    if (randomValue < cumulativeWeight) {
      return value;
    }
  }
  return weights[weights.length - 1].value; // Fallback
}

export function initialGameState(game: LeagueGame): LeagueGameState {
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
    weather: 'clear',
    ballpark: 'bigField',
    leagueGame: game,
    winningPitcherId: null,
    losingPitcherId: null,
    saveElligiblePitcherId: null,
  };
}

function addToPlayerStats(
  gameState: LeagueGameState,
  playerId: string,
  stats: Partial<PlayerStats>,
): LeagueGameState {
  if (!gameState.playerStats[playerId]) {
    gameState.playerStats[playerId] = {};
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

function runnersOnBases(gameState: LeagueGameState): number {
  return Object.values(gameState.bases).filter((playerId) => playerId !== null)
    .length;
}

function advanceRunnerForced(
  gameState: LeagueGameState,
  league: League,
  base: Base,
  sourcePlayerId: PlayerId,
  pitchingPlayerId: PlayerId,
): LeagueGameState {
  if (base < 1 || base > 3) {
    throw new Error('Base must be between 1 and 3');
  }
  const currentPlayerId = gameState.bases[base];
  const pitcherId = getCurrentPitcher(gameState);
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
    league = updatePlayerHeat('batting', currentPlayerId, league, 'run');
    league = updatePlayerHeat('batting', sourcePlayerId, league, 'rbi');
    league = updatePlayerHeat('pitching', pitcherId, league, 'run');
    gameState.teamData[gameState.battingTeam].score += 1;
    return gameState;
  }
  advanceRunnerForced(
    gameState,
    league,
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
  league: League,
  sourcePlayerId: PlayerId,
  pitchingPlayerId: PlayerId,
  count: number = 1,
): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  if (count > 1) {
    gameState = advanceAllRunners(
      gameState,
      league,
      sourcePlayerId,
      pitchingPlayerId,
      count - 1,
    );
  }
  gameState = advanceRunnerForced(
    gameState,
    league,
    3,
    currentBatter,
    currentPitcher,
  );
  gameState = advanceRunnerForced(
    gameState,
    league,
    2,
    currentBatter,
    currentPitcher,
  );
  gameState = advanceRunnerForced(
    gameState,
    league,
    1,
    currentBatter,
    currentPitcher,
  );
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
  return last(gameState.teamData[gameState.pitchingTeam].pitchers)!;
}

type PerkInfo = {
  source: Weather | Ballpark | Perk | Status;
  effect: PerkEffect;
};

function getActivePlayerPerks(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
  pitchKind?: PitchKind,
): PerkInfo[] {
  const targetPlayer = league.playerLookup[playerId];
  const playerTeam = targetPlayer.teamId;
  const { battingTeam, pitchingTeam } = gameState;
  const weatherId = gameState.weather;
  const weatherInfo = weatherData[weatherId];
  const ballparkId = gameState.ballpark;
  const ballparkInfo = ballparkData[ballparkId];
  const players = [
    ...gameState.teamData[battingTeam].battingOrder,
    ...gameState.teamData[pitchingTeam].battingOrder,
  ].map((pid) => league.playerLookup[pid]);

  return [
    { source: weatherInfo, effect: weatherInfo.effect() },
    {
      source: ballparkInfo,
      effect: ballparkInfo.effect({
        gameState,
        isHome: gameState.leagueGame.homeTeamId === playerTeam,
      }),
    },
    ...players.flatMap((player) =>
      player.perkIds
        .map((id) => perks[id])
        .filter(Boolean)
        .filter((p: Perk) => {
          return (
            !p.condition ||
            p.condition({
              pitchKind,
              gameState,
              targetPlayer,
              sourcePlayer: player,
              weather: weatherId,
              isMyTeam: playerTeam === player.teamId,
              isMe: player.id === playerId,
              isBatter: player.id === getCurrentBatter(gameState),
              isPitcher: player.id === getCurrentPitcher(gameState),
              isRunner:
                gameState.bases[1] === player.id ||
                gameState.bases[2] === player.id ||
                gameState.bases[3] === player.id,
            })
          );
        })
        .map((p) => ({ source: p, effect: p.effect() })),
    ),
    ...players.flatMap((player) =>
      Object.entries(player.statusIds)
        .filter(([id, stacks]) => {
          const s = statusData[id as StatusType];
          return (
            !s.condition ||
            s.condition({
              stacks,
              pitchKind,
              gameState,
              targetPlayer,
              sourcePlayer: player,
              weather: weatherId,
              isMyTeam: playerTeam === player.teamId,
              isMe: player.id === playerId,
              isBatter: player.id === getCurrentBatter(gameState),
              isPitcher: player.id === getCurrentPitcher(gameState),
              isRunner:
                gameState.bases[1] === player.id ||
                gameState.bases[2] === player.id ||
                gameState.bases[3] === player.id,
            })
          );
        })
        .map(([id, stacks]) => {
          const s = statusData[id as StatusType];
          return { source: s, effect: s.effect({ stacks }) };
        }),
    ),
  ];
}

function getModifiedAttributes(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
  activePerks: PerkEffect[],
): Player['attributes'] {
  const clutchFactor = determineClutchFactor(gameState);
  const player = league.playerLookup[playerId];
  const stamina = Math.min(1, Math.max(0, player.stamina));
  const staminaFactor = Math.max(0, (0.8 - stamina) * 5);
  const reduction = staminaFactor;
  const baseStats = sumObjects(
    player.attributes,
    ...(activePerks.map((p) => p.attributeBonus).filter(Boolean) as Partial<
      Player['attributes']
    >[]),
    {
      strength: -reduction,
      agility: -reduction,
      constitution: -reduction,
      wisdom: -reduction,
      intelligence: -reduction,
      charisma: -reduction,
    },
  );
  const clutchMod = clutchFactor * scaleAttribute(baseStats.charisma, 10);
  return sumObjects(baseStats, {
    strength: clutchMod,
    agility: clutchMod,
    constitution: clutchMod,
    wisdom: clutchMod,
    intelligence: clutchMod,
  });
}
function getModifiedCompositeBattingRatings(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
  activePerks: PerkInfo[] = [],
): BattingCompositeRatings {
  const player = league.playerLookup[playerId];
  const attributes = getModifiedAttributes(
    playerId,
    league,
    gameState,
    activePerks.map((p) => p.effect),
  );
  const baseCompositeRatings = getBattingCompositeRatings(player, attributes);
  return sumObjects(
    baseCompositeRatings,
    ...(activePerks
      .map((p) => p.effect.battingCompositeBonus)
      .filter(Boolean) as Partial<BattingCompositeRatings>[]),
  );
}

function getModifiedCompositePitchingRatings(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
  activePerks: PerkInfo[] = [],
): PitchingCompositeRatings {
  const attributes = getModifiedAttributes(
    playerId,
    league,
    gameState,
    activePerks.map((p) => p.effect),
  );
  const player = league.playerLookup[playerId];
  const baseCompositeRatings = getPitchingCompositeRatings(player, attributes);
  return sumObjects(
    baseCompositeRatings,
    ...(activePerks
      .map((p) => p.effect.pitchingCompositeBonus)
      .filter(Boolean) as Partial<PitchingCompositeRatings>[]),
  );
}

function applyWalk(
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  gameState = advanceRunnerForced(
    gameState,
    league,
    1,
    currentBatter,
    currentPitcher,
  );
  gameState.bases[1] = currentBatter;
  return gameState;
}

function applyHit(
  gameState: LeagueGameState,
  league: League,
  hitType: PitchOutcome,
): LeagueGameState {
  const nextBases = { ...gameState.bases };
  const currentBatter = getCurrentBatter(gameState);
  const currentPitcher = getCurrentPitcher(gameState);
  switch (hitType) {
    case 'hit':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        1,
      );
      gameState.bases[1] = currentBatter;
      break;
    case 'double':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        2,
      );
      nextBases[2] = currentBatter;
      break;
    case 'triple':
      gameState = advanceAllRunners(
        gameState,
        league,
        currentBatter,
        currentPitcher,
        3,
      );
      nextBases[3] = currentBatter;
      break;
    case 'homeRun':
      gameState = advanceAllRunners(
        gameState,
        league,
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
  pitchData: ActualPitch,
): boolean {
  const baseSwingChance = isStrike ? 0.68 : 0.25;
  const activePerks = getActivePlayerPerks(
    batter.id,
    league,
    game,
    pitchData.kind,
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    game,
    activePerks,
  );
  const count = 2 * game.strikes - game.balls;
  // const countWeight = 2 ** (batterComposite.plateDiscipline / 5) - 1;
  // const swingModifier = scaleAttributePercent(
  //   valueByWeights([
  //     { value: count, weight: countWeight },

  //     // TODO: Decide how to handle this (used to be agility)
  //     // Maybe simplify a bit?
  //     {
  //       value: isStrike
  //         ? batterComposite.plateDiscipline
  //         : 20 - batterComposite.plateDiscipline,
  //       weight: 3,
  //     },
  //   ]),
  //   2,
  // );
  // let swingChance = isStrike
  //   ? 0.68 ** (1 / swingModifier)
  //   : 0.25 ** (1 / swingModifier);
  const pitchSwingFactor = pitchData.swingFactor;
  const plateDisciplineFactor =
    scaleAttributePercent(batterComposite.plateDiscipline, 3) **
    (isStrike ? 1 : -1);
  const swing = randomByWeight<boolean>(random, [
    {
      value: true,
      weight: baseSwingChance * pitchSwingFactor * plateDisciplineFactor,
    },
    { value: false, weight: 1 - baseSwingChance },
  ]);
  return swing;
}

function determineContact(
  random: GameRandom,
  isStrike: boolean,
  batter: Player,
  league: League,
  gameState: LeagueGameState,
  pitchData: ActualPitch,
): boolean {
  const activePerks = getActivePlayerPerks(
    batter.id,
    league,
    gameState,
    pitchData.kind,
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    gameState,
    activePerks,
  );
  let baseContactChance = isStrike ? 0.8 : 0.6;

  const batterContactFactor = scaleAttributePercent(batterComposite.contact, 4);
  const pitchContactFactor = pitchData.contactFactor;

  const weights = [
    {
      value: true,
      weight: baseContactChance * pitchContactFactor * batterContactFactor,
    },
    {
      value: false,
      weight: 1 - baseContactChance,
    },
  ];

  const contact = randomByWeight<boolean>(random, weights);
  // pitchData.contactChance = {
  //   raw: baseContactChance,
  //   pitcherFactor: pitchContactFactor,
  //   batterFactor: batterContactFactor,
  //   batterRating: batterComposite.contact,
  //   activePerks: activePerks.map((p) => p.source.name),
  //   adjusted: weights[0].weight / sum(...weights.map((w) => w.weight)),
  // };
  return contact;
}

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

function getCountAdvantage(
  balls: number,
  strikes: number,
): 'behind' | 'neutral' | 'ahead' {
  if (balls - strikes >= 2) {
    return 'behind';
  }
  if (strikes === 2 || strikes > balls) {
    return 'ahead';
  }
  return 'neutral';
}

function determinePitchType(
  random: GameRandom,
  batter: Player,
  pitcher: Player,
  game: LeagueGameState,
  league: League,
): ActualPitch {
  const pitchKind = random.item(Object.keys(pitchTypes) as PitchKind[]);
  const activePerks = getActivePlayerPerks(pitcher.id, league, game, pitchKind);
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    game,
    activePerks,
  );

  const pitcherComposite = getModifiedCompositePitchingRatings(
    pitcher.id,
    league,
    game,
    activePerks,
  );

  const randomMod = 5 * random.float(-1, 1);
  let attributeTotal = 10 + randomMod;
  const duelingFactor =
    0.5 * (pitcherComposite.dueling - batterComposite.dueling);
  attributeTotal +=
    0.2 * Math.pow(Math.abs(duelingFactor), 1.5) * Math.sign(duelingFactor);
  attributeTotal += 0.15 * (pitcherComposite.strikeout - 10) * game.strikes;
  attributeTotal +=
    (0.15 * (pitcherComposite.composure - 10) * game.balls * 2) / 3;
  // attributeTotal +=
  //   (0.2 * (pitcherComposite.dependable - 10) * game.balls * 2) / 3;

  // switch (pitchKind) {
  //   case 'fastball':
  //     attributeTotal += (pitcherAttributes.strength - 10) * 0.4;
  //   case 'curveball':
  //     attributeTotal += (pitcherAttributes.agility - 10) * 0.4;
  //     break;
  //   case 'changeup':
  //     attributeTotal += (pitcherAttributes.wisdom - 10) * 0.4;
  //     break;
  //   case 'slider':
  //     attributeTotal += (pitcherAttributes.intelligence - 10) * 0.4;
  //     break;
  //   case 'sinker':
  //     attributeTotal += (pitcherAttributes.constitution - 10) * 0.4;
  //     break;
  //   default:
  //     throw new Error(`Unknown pitch kind: ${pitchKind}`);
  // }
  activePerks.forEach((perk) => {
    const qb = perk.effect.qualityBonus;
    if (qb) {
      attributeTotal += qb;
    }
  });

  const qualityModifier = attributeTotal - 10;
  // console.log({
  //   qualityModifier,
  //   attributeTotal,
  //   randomMod,
  //   perks: activePerks.map((p) => ({
  //     name: p.name,
  //     qb: p.effect().qualityBonus,
  //   })),
  //   dueling: 0.2 * (pitcherComposite.dueling - batterComposite.dueling),
  //   strikeout: 0.2 * (pitcherComposite.strikeout - 10) * game.strikes,
  // });
  const modifiedMovement = pitcherComposite.movement + qualityModifier;
  const modifiedVelocity = pitcherComposite.velocity + qualityModifier;
  let quality = scaleAttributePercent(attributeTotal, 2);
  const basePitchData = pitchTypes[pitchKind]({
    quality,
    movement: modifiedMovement,
    velocity: modifiedVelocity,
  });

  const countAdvantage = getCountAdvantage(game.balls, game.strikes);
  const countFactor =
    {
      behind: 5,
      neutral: 1,
      ahead: -4,
    }[countAdvantage] ?? 0;
  const strikeDesireChance =
    0.66 *
    scaleAttributePercent(
      10 +
        0.2 * (10 - getPlayerOverall(batter) / 6) +
        countFactor +
        runnersOnBases(game) * 2,
      1.5,
    );
  const strikeDesire = random.float(0, 1) < strikeDesireChance;

  const strikeFactor =
    0.55 +
    scaleAttribute(
      pitcherComposite.accuracy + basePitchData.accuracyBonus,
      0.4,
    );

  const isStrike =
    random.float(0, 1) < strikeFactor ? strikeDesire : !strikeDesire;
  if (isStrike !== strikeDesire) {
    quality -= 0.2;
  }

  if (!quality) {
    throw new Error(
      `Pitch quality can't be zero or negative ${JSON.stringify({
        pitcher,
        strikeDesire,
        duelingFactor,
        qualityModifier,
        attributeTotal,
        basePitchData,
        // duel: 0.2 * Math.pow(duelingFactor, 1.5) * Math.sign(duelingFactor),
      })}`,
    );
  }

  const {
    contactStrikeFactor,
    contactBallFactor,
    swingStrikeFactor,
    swingBallFactor,
    ...rest
  } = basePitchData;
  const pitchData: ActualPitch = {
    ...rest,
    contactFactor: isStrike ? contactStrikeFactor : contactBallFactor,
    swingFactor: isStrike ? swingStrikeFactor : swingBallFactor,
    velocity: modifiedVelocity,
    movement: modifiedMovement,
    kind: pitchKind,
    quality,
    isStrike,
  };
  // console.log('base pitch data', pitchData);
  // logger.debug(JSON.stringify(pitchData));

  // STR = strikeouts = more strikes, fewer swings at strikes
  // AGI = finesse = less contact
  // CON = higher counts, fewer swings in general
  // WIS = poor decisions, swing more at balls and less at strikes
  // INT = deception = higher pitch quality
  // CHA = higher pitch quality in clutch situations

  if (isStrike) {
    pitchData.swingFactor *=
      1 /
      scaleAttributePercent(modifiedVelocity, 2) /
      scaleAttributePercent(pitcherComposite.accuracy, 1.5);
    pitchData.contactFactor *= 1 / scaleAttributePercent(modifiedVelocity, 2);
  } else {
    pitchData.swingFactor *=
      scaleAttributePercent(modifiedMovement, 2) *
      scaleAttributePercent(pitcherComposite.accuracy, 1.5);
    pitchData.contactFactor *= 1 / scaleAttributePercent(modifiedMovement, 2);
  }

  Object.keys(pitchData.hitModifierTable.power).forEach((key) => {
    if (!key || !pitchData.hitModifierTable.power[key as HitPower]) {
      return;
    }
    pitchData.hitModifierTable.power[key as HitPower] =
      (pitchData.hitModifierTable.power[key as HitPower] ?? 1) ** quality;
  });
  Object.keys(pitchData.hitModifierTable.type).forEach((key) => {
    if (!key || !pitchData.hitModifierTable.type[key as HitType]) {
      return;
    }
    pitchData.hitModifierTable.type[key as HitType] =
      (pitchData.hitModifierTable.type[key as HitType] ?? 1) ** quality;
  });

  pitchData.hitModifierTable.type.grounder =
    (pitchData.hitModifierTable.type.grounder ?? 1) *
    scaleAttributePercent(pitcherComposite.hitAngle, 2);
  pitchData.hitModifierTable.power.strong =
    (pitchData.hitModifierTable.power.strong ?? 1) /
    scaleAttributePercent(pitcherComposite.hitPower, 2);
  // pitchData.hitModifierTable.type.lineDrive =
  //   (pitchData.hitModifierTable.type.lineDrive ?? 1) /
  //   scaleAttributePercent(pitcherComposite.extraBases, 1.5);
  // console.log('modified pitch data', pitchData);

  return pitchData;
}

function determineDefender(
  random: GameRandom,
  hitArea: HitArea,
  hitType: HitType,
): keyof PositionChart {
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
  hitTable: HitTable;
  defenderRating: number;
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
    pitchData.kind,
  );
  activePerks.forEach((perk) => {
    const h = perk.effect.hitModifierTable;
    if (h?.power)
      pitchData.hitModifierTable.power = multiplyObjects(
        pitchData.hitModifierTable.power,
        h.power,
      );

    if (h?.type) {
      pitchData.hitModifierTable.type = multiplyObjects(
        pitchData.hitModifierTable.type,
        h.type,
      );
    }
  });

  const batterCompositeRatings = getModifiedCompositeBattingRatings(
    batter,
    league,
    gameState,
    activePerks,
  );
  const hitAreaTable: Record<HitArea, number> = {
    farLeft: 1,
    left: 3,
    center: 4,
    right: 2,
    farRight: 1,
  };
  const hitArea = random.table(hitAreaTable);
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
          strong: scaleAttributePercent(batterCompositeRatings.hitPower, 2),
        },
    pitchData.hitModifierTable.power,
  );
  const hitPower = random.table(hitPowerTable);
  const hitTypeTable: Record<HitType, number> = multiplyObjects(
    isStrike
      ? {
          grounder: 4,
          fly: 3 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          lineDrive:
            2 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          popUp: 1,
        }
      : {
          grounder: 6,
          fly: 2 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          lineDrive:
            1 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          popUp: 2,
        },
    pitchData.hitModifierTable.type,
  );
  const hitType = random.table(hitTypeTable);

  // Determine defender based on hit direction and type
  const defender = determineDefender(random, hitArea, hitType);
  const defendingPlayerId =
    league.teamLookup[gameState.pitchingTeam].positionChart[defender];
  if (!defendingPlayerId) {
    throw new Error(`No player found for defender position: ${defender}`);
  }
  const defenderComposite = getModifiedCompositeBattingRatings(
    defendingPlayerId,
    league,
    gameState,
    activePerks,
  );
  const defenseModifier = scaleAttributePercent(defenderComposite.fielding, 3);
  let baseHitTable: Partial<HitTable> = {};
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
          0.3 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        hit: 3,
        out: 5,
        triple:
          0.1 * scaleAttributePercent(batterCompositeRatings.extraBases, 4),
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
        double: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 4),
        out: 15,
        triple:
          0.2 * scaleAttributePercent(batterCompositeRatings.extraBases, 8),
        homeRun:
          0.1 * scaleAttributePercent(batterCompositeRatings.homeRuns, 3),
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        hit: 0.5,
        double: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 5),
        out: 2,
        triple:
          0.5 * scaleAttributePercent(batterCompositeRatings.extraBases, 10),
        homeRun: 6 * scaleAttributePercent(batterCompositeRatings.homeRuns, 3),
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
          0.5 * scaleAttributePercent(batterCompositeRatings.extraBases, 3),
        triple:
          0.3 * scaleAttributePercent(batterCompositeRatings.extraBases, 6),
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        hit: 8,
        double: 2 * scaleAttributePercent(batterCompositeRatings.extraBases, 4),
        out: 1,
        triple: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 8),
        homeRun:
          0.5 * scaleAttributePercent(batterCompositeRatings.homeRuns, 5),
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
    ...baseHitTable,
  };
  hitTable = multiplyHitTables(hitTable, { out: defenseModifier });
  for (const perk of activePerks) {
    const h = perk.effect.hitTableFactor;
    if (h) {
      hitTable = multiplyHitTables(hitTable, h);
    }
  }
  // TODO: more specific calculation for foul balls
  const isFoul = random.float(0, 1) < 0.5;

  const result = isFoul ? (random.table(hitTable) as PitchOutcome) : 'foul';
  return {
    hitArea,
    hitPower,
    hitType,
    defender,
    defenderId: defendingPlayerId,
    outcome: result,
    hitTable,
    defenderRating: defenderComposite.fielding,
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
  const pitcherId = getCurrentPitcher(gameState);
  const defenderComposite = getModifiedCompositeBattingRatings(
    catcherId,
    league,
    gameState,
    getActivePlayerPerks(catcherId, league, gameState),
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    playerId,
    league,
    gameState,
    getActivePlayerPerks(playerId, league, gameState),
  );
  const agilityFactor = scaleAttributePercent(
    batterComposite.stealing + (10 - defenderComposite.fielding) / 5,
    1 / 0.8,
  );
  const baseFactor = fromBase === 2 ? 0.8 : 0.7;
  const stealSuccessChance = baseFactor * agilityFactor;
  if (random.float(0, 1) < stealSuccessChance) {
    gameState.bases[fromBase] = null;
    if (fromBase === 3) {
      gameState.teamData[gameState.battingTeam].score += 1;
      gameState = addToPlayerStats(gameState, playerId, {
        runs: 1,
      });
      league = updatePlayerHeat('batting', playerId, league, 'run');
      league = updatePlayerHeat('pitching', pitcherId, league, 'run');
    } else {
      gameState.bases[(fromBase + 1) as Base] = playerId;
    }
    gameState = addToPlayerStats(gameState, playerId, {
      stolenBases: 1,
    });
    league = updatePlayerHeat('batting', playerId, league, 'steal');
    league = updatePlayerHeat('pitching', catcherId, league, 'steal');
    league = updatePlayerHeat('pitching', pitcherId, league, 'steal');
  } else {
    gameState = addToPlayerStats(gameState, playerId, {
      caughtStealing: 1,
    });
    league = updatePlayerHeat('batting', playerId, league, 'caughtStealing');
    league = updatePlayerHeat('pitching', catcherId, league, 'caughtStealing');
    league = updatePlayerHeat('pitching', pitcherId, league, 'caughtStealing');
    gameState.outs += 1;
    gameState = addToPlayerStats(gameState, getCurrentPitcher(gameState), {
      outsPitched: 1,
    });
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
  const catcherComposite = getModifiedCompositeBattingRatings(
    catcherId,
    league,
    gameState,
    getActivePlayerPerks(catcherId, league, gameState),
  );
  const playerOnFirst = gameState.bases[1];
  const playerOnSecond = gameState.bases[2];
  const playerOnThird = gameState.bases[3];
  if (playerOnFirst !== null && playerOnSecond === null) {
    const runnerComposite = getModifiedCompositeBattingRatings(
      playerOnFirst,
      league,
      gameState,
      getActivePlayerPerks(playerOnFirst, league, gameState),
    );
    const agilityFactor = scaleAttributePercent(
      runnerComposite.stealing + (10 - catcherComposite.fielding) / 5,
      20,
    );
    const stealAttemptChance = 0.04 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 1, league);
    }
  }
  if (playerOnSecond !== null && playerOnThird === null) {
    const runnerComposite = getModifiedCompositeBattingRatings(
      playerOnSecond,
      league,
      gameState,
      getActivePlayerPerks(playerOnSecond, league, gameState),
    );
    const agilityFactor = scaleAttributePercent(
      runnerComposite.stealing + (10 - catcherComposite.fielding) / 5,
      20,
    );
    const stealAttemptChance = 0.01 * agilityFactor;
    if (random.float(0, 1) < stealAttemptChance) {
      gameState = attemptSteal(random, gameState, 2, league);
    }
  }
  // TODO: Implement stealing home
  return gameState;
}

function logsPitchData({
  hitModifierTable,
  ...pd
}: ActualPitch): LogsPitchData {
  return pd;
}

export function simulatePitch(
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

  // Determine the outcome of the pitch
  let outcome: PitchOutcome;
  let hitResult: HitResult | null = null;
  const batterSwung = determineSwing(
    random,
    pitchData.isStrike,
    batter,
    league,
    gameState,
    pitchData,
  );
  if (!batterSwung) {
    outcome = pitchData.isStrike ? 'strike' : 'ball';
  } else {
    const contactMade = determineContact(
      random,
      pitchData.isStrike,
      batter,
      league,
      gameState,
      pitchData,
    );
    if (contactMade) {
      hitResult = determineHitResult(
        random,
        pitchData,
        pitchData.isStrike,
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
        gameState = applyWalk(gameState, league);
        gameState = addToPlayerStats(gameState, batterId, {
          walks: 1,
        });
        gameState = addToPlayerStats(gameState, pitcherId, {
          pWalks: 1,
        });
        gameState = logger.addToGameLog(
          {
            kind: 'walk',
            batterId,
            pitcherId,
            pitchData: logsPitchData(pitchData),
          },
          gameState,
        );
        league = updatePlayerHeat('batting', batterId, league, 'walk');
        league = updatePlayerHeat('pitching', pitcherId, league, 'walk');
        nextBatter = true;
      } else {
        gameState = logger.addToGameLog(
          {
            kind: 'ball',
            batterId,
            pitcherId,
            strikes: gameState.strikes,
            balls: gameState.balls,
            pitchData: logsPitchData(pitchData),
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
        gameState = logger.addToGameLog(
          {
            kind: 'strikeout',
            batterId,
            pitcherId,
            swung: batterSwung,
            pitchData: logsPitchData(pitchData),
          },
          gameState,
        );
        league = updatePlayerHeat('batting', batterId, league, 'strikeout');
        league = updatePlayerHeat('pitching', pitcherId, league, 'strikeout');
        nextBatter = true;
        gameState.outs += 1;
      } else {
        gameState = logger.addToGameLog(
          {
            kind: 'strike',
            batterId,
            pitcherId,
            strikes: gameState.strikes,
            balls: gameState.balls,
            swung: batterSwung,
            pitchData: logsPitchData(pitchData),
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
      gameState = logger.addToGameLog(
        {
          kind: 'foul',
          batterId,
          pitcherId,
          strikes: gameState.strikes,
          balls: gameState.balls,
          pitchData: logsPitchData(pitchData),
        },
        gameState,
      );
      break;
    case 'out':
      // TODO: Handle sacrifice hits
      // Increment out count
      gameState.outs += 1;

      if (gameState.outs < 3) {
        // Check for sacrifice fly
        if (hitResult?.hitType === 'fly' && hitResult?.hitPower !== 'weak') {
          gameState = advanceRunnerForced(
            gameState,
            league,
            3,
            batterId,
            pitcherId,
          );
          if (hitResult.hitPower === 'strong') {
            gameState = advanceRunnerForced(
              gameState,
              league,
              2,
              batterId,
              pitcherId,
            );
          }
        }
      }
      gameState = addToPlayerStats(gameState, batterId, { atBats: 1 });
      gameState = addToPlayerStats(gameState, pitcherId, {
        outsPitched: 1,
      });
      if (!hitResult) {
        throw new Error('Hit result is undefined');
      }
      gameState = logger.addToGameLog(
        {
          kind: 'out',
          batterId,
          pitcherId,
          type: hitResult.hitType,
          direction: hitResult.hitArea,
          power: hitResult.hitPower,
          defender: hitResult.defender,
          defenderId: hitResult.defenderId,
          hitTable: hitResult.hitTable,
          defenderRating: hitResult.defenderRating,
          pitchData: logsPitchData(pitchData),
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
      gameState = logger.addToGameLog(
        {
          kind: outcome,
          batterId,
          pitcherId,
          type: hitResult.hitType,
          direction: hitResult.hitArea,
          power: hitResult.hitPower,
          defender: hitResult.defender,
          defenderId: hitResult.defenderId,
          hitTable: hitResult.hitTable,
          defenderRating: hitResult.defenderRating,
          pitchData: logsPitchData(pitchData),
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
      gameState = applyHit(gameState, league, outcome);
      league = updatePlayerHeat('batting', batterId, league, outcome);
      league = updatePlayerHeat('pitching', pitcherId, league, outcome);
      nextBatter = true;
      break;
  }

  // Adjust pitching stamina
  const pitcherComposite = getModifiedCompositePitchingRatings(
    pitcherId,
    league,
    gameState,
    getActivePlayerPerks(pitcherId, league, gameState, pitchData.kind),
  );
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    gameState,
    getActivePlayerPerks(batter.id, league, gameState, pitchData.kind),
  );
  const isReliever = pitcher.positions.some((pos) => pos === 'rp');
  let pitcherStaminaChange =
    scaleAttributePercent(
      pitcherComposite.durability,
      isReliever ? 1.015 : 1.002,
    ) - (isReliever ? 1.04 : 1.008);
  pitcherStaminaChange *=
    {
      strike: 1,
      ball: 1,
      foul: 1,
      out: 1,
      hit: 1.5,
      double: 2,
      triple: 3,
      homeRun: 5,
    }[outcome] ?? 1;
  pitcher.stamina = Math.max(-0.25, pitcher.stamina + pitcherStaminaChange);
  batter.stamina = Math.max(
    -0.25,
    batter.stamina +
      scaleAttributePercent(batterComposite.durability, 1.006) -
      1.014,
  );
  if (
    random.float(0, 1) <
    (isReliever ? 0.001 : 0.0005) /
      scaleAttributePercent(pitcherComposite.durability, 4)
  ) {
    league.playerLookup[pitcherId].statusIds.injured =
      (league.playerLookup[pitcherId].statusIds.injured ?? 0) +
      Math.floor(random.float(2, 10));
    gameState = logger.addToGameLog(
      {
        kind: 'injury',
        playerId: pitcherId,
      },
      gameState,
    );
    const pid = considerSwapPitcher(gameState, league);
    if (pid) {
      gameState = swapPitcher(gameState, pid);
    }
  }
  if (
    random.float(0, 1) <
    0.002 / scaleAttributePercent(batterComposite.durability, 4)
  ) {
    league.playerLookup[batterId].statusIds.injured =
      (league.playerLookup[batterId].statusIds.injured ?? 0) +
      Math.floor(random.float(2, 10));
    gameState = logger.addToGameLog(
      {
        kind: 'injury',
        playerId: batterId,
      },
      gameState,
    );
    // TODO: Swap batter if injured
  }

  if (nextBatter) {
    gameState = incrementBatterIndex(gameState, gameState.battingTeam);
    gameState = resetCount(gameState);
  }

  const battingTeamScore = gameState.teamData[gameState.battingTeam].score;
  const pitchingTeamScore = gameState.teamData[gameState.pitchingTeam].score;
  if (battingTeamScore >= pitchingTeamScore) {
    gameState.saveElligiblePitcherId = null;
    if (
      !gameState.winningPitcherId ||
      league.teamLookup[gameState.pitchingTeam].playerIds.includes(
        gameState.winningPitcherId,
      )
    ) {
      const tied = battingTeamScore === pitchingTeamScore;
      gameState.winningPitcherId = tied
        ? null
        : last(gameState.teamData[gameState.battingTeam].pitchers)!;
      gameState.losingPitcherId = tied
        ? null
        : last(gameState.teamData[gameState.pitchingTeam].pitchers)!;
    }
  }

  return gameState;
}

function considerSwapPitcher(
  gameState: LeagueGameState,
  league: League,
): PlayerId | null {
  const pitcherId = getCurrentPitcher(gameState);
  const pitcher = league.playerLookup[pitcherId];
  const injured = !!pitcher.statusIds.injured;
  if (!injured && (gameState.strikes !== 0 || gameState.balls !== 0)) {
    // Don't swap pitchers if the count is not reset
    return null;
  }

  if (!pitcher) {
    throw new Error(`No pitcher found for team ${gameState.pitchingTeam}`);
  }
  if (!injured && pitcher.stamina > 0.2) {
    return null;
  }
  const team = league.teamLookup[gameState.pitchingTeam];
  const alternatePitchers = team.playerIds
    .map((pid) => league.playerLookup[pid])
    .filter(
      (p) =>
        !team.pitchingOrder.includes(p.id) &&
        p.positions.some((pos) => isPitcher(pos)) &&
        p.stamina > 0.5 &&
        !p.statusIds.injured,
    );
  if (alternatePitchers.length === 0) {
    return null;
  }
  // Sort by overall
  return alternatePitchers.reduce((a, b) => {
    const aOverall = sum(
      ...Object.values(getModifiedAttributes(a.id, league, gameState, [])),
    );
    const bOverall = sum(
      ...Object.values(getModifiedAttributes(b.id, league, gameState, [])),
    );
    if (aOverall > bOverall) {
      return a;
    } else {
      return b;
    }
  }).id;
}

function swapPitcher(
  gameState: LeagueGameState,
  newPitcherId: PlayerId,
): LeagueGameState {
  const oldPitcherId = getCurrentPitcher(gameState);
  gameState = logger.addToGameLog(
    {
      kind: 'pitcherChange',
      teamId: gameState.pitchingTeam,
      oldPitcherId,
      newPitcherId,
    },
    gameState,
  );
  gameState.teamData[gameState.pitchingTeam].pitchers.push(newPitcherId);
  // determine save elligibility
  const rd =
    gameState.teamData[gameState.pitchingTeam].score -
    gameState.teamData[gameState.battingTeam].score;
  const potentialRuns =
    2 + Object.values(gameState.bases).filter((b) => b !== null).length;
  const inningInfo = getInningInfo(gameState.currentInning);
  const potentiallyLastInning =
    inningInfo.inning >= 9 ||
    (inningInfo.inning === 8 && inningInfo.half === 'bottom');
  if (gameState.saveElligiblePitcherId === oldPitcherId) {
    gameState.saveElligiblePitcherId = null;
  }
  if (
    (rd > 0 && rd <= 3 && (!potentiallyLastInning || gameState.outs === 0)) ||
    rd <= potentialRuns
  ) {
    gameState.saveElligiblePitcherId = newPitcherId;
  }
  return gameState;
}

const heatLookup = {
  strikeout: -3,
  walk: 1,
  out: -1,
  hit: 2,
  double: 3,
  triple: 4,
  homeRun: 5,
  steal: 2,
  caughtStealing: -2,
  run: 1,
  rbi: 2,
} satisfies Record<
  AtBatOutcome | 'steal' | 'caughtStealing' | 'run' | 'rbi',
  number
>;

function updatePlayerHeat(
  kind: 'batting' | 'pitching',
  playerId: PlayerId,
  league: League,
  outcome: AtBatOutcome | 'steal' | 'caughtStealing' | 'run' | 'rbi',
): League {
  const player = league.playerLookup[playerId];
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found in league`);
  }

  const count = 0.5 * (kind === 'batting' ? 1 : -1) * heatLookup[outcome];
  player.statusIds.streak = (player.statusIds.streak ?? 0) + count;
  return league;
}

function simulateInning(
  random: GameRandom,
  gameState: LeagueGameState,
  league: League,
): LeagueGameState {
  const initialScore = gameState.teamData[gameState.battingTeam].score;
  gameState = logger.addToGameLog(
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
    const nextPitcher = considerSwapPitcher(gameState, league);
    if (nextPitcher) {
      gameState = swapPitcher(gameState, nextPitcher);
    }
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
