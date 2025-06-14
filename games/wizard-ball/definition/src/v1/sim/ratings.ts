import {
  getBattingCompositeRatings,
  getPitchingCompositeRatings,
} from '../attributes';
import { Ballpark, ballparkData } from '../ballparkData';
import type {
  League,
  LeagueGameState,
  Player,
  BattingCompositeRatings,
  PitchingCompositeRatings,
} from '../gameTypes';
import { Perk, PerkEffect, perks } from '../perkData';
import { PitchKind } from '../pitchData';
import { Status, statusData, StatusType } from '../statusData';
import { sumObjects, scaleAttribute, multiplyObjects } from '../utils';
import { Weather, weather as weatherData } from '../weatherData';
import { determineClutchFactor } from './clutch';
import { getCurrentBatter, getCurrentPitcher } from './utils';

export type PerkInfo = {
  source: Weather | Ballpark | Perk | Status;
  effect: PerkEffect;
};

export function getActivePlayerPerks(
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
          const currentBatter = getCurrentBatter(gameState);
          const currentPitcher = getCurrentPitcher(gameState);
          const isBatter = currentBatter === player.id;
          const isPitcher = currentPitcher === player.id;
          if (p.name === 'Curse Trigger') {
            // console.log('HEY');
          }
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
              isBatter,
              isPitcher,
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

export function getModifiedAttributes(
  playerId: string,
  league: League,
  gameState: LeagueGameState,
  activePerks: PerkEffect[],
): Player['attributes'] {
  const clutchFactor = determineClutchFactor(gameState);
  const player = league.playerLookup[playerId];
  const stamina = Math.min(1, Math.max(0, player.stamina));
  const staminaFactor = Math.max(0, (0.8 - stamina) * 2) + 1;
  const reduction = 1.0 / staminaFactor;
  let baseStats = sumObjects(
    player.attributes,
    ...(activePerks.map((p) => p.attributeBonus).filter(Boolean) as Partial<
      Player['attributes']
    >[]),
  );

  const clutchMod = clutchFactor * scaleAttribute(baseStats.charisma, 10);
  baseStats = sumObjects(baseStats, {
    strength: clutchMod,
    agility: clutchMod,
    constitution: clutchMod,
    wisdom: clutchMod,
    intelligence: clutchMod,
  });

  return multiplyObjects(baseStats, {
    strength: reduction,
    agility: reduction,
    constitution: reduction,
    wisdom: reduction,
    intelligence: reduction,
    charisma: reduction,
  });
}
export function getModifiedCompositeBattingRatings(
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

export function getModifiedCompositePitchingRatings(
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
