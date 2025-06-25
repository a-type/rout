import { GameRandom } from '@long-game/game-definition';
import { League, LeagueGameState } from '../gameTypes';
import { TriggerEvent } from '../perkData';
import { ActualPitch } from '../pitchData';
import { getActivePlayerPerks } from './ratings';

export function checkTriggerEvent(
  event: TriggerEvent,
  playerId: string,
  gameState: LeagueGameState,
  league: League,
  random: GameRandom,
  pitchData: ActualPitch,
) {
  const activePerks = getActivePlayerPerks(
    playerId,
    league,
    gameState,
    pitchData.kind,
  );
  activePerks.forEach((perk) => {
    if ('trigger' in perk.effect && perk.effect.trigger) {
      gameState = perk.effect.trigger({
        event,
        random,
        gameState,
        league,
        player: league.playerLookup[playerId],
      });
    }
  });
  return gameState;
}
