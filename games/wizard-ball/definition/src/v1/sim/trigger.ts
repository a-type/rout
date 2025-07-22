import { GameRandom } from '@long-game/game-definition';
import { TriggerEvent } from '../data/perkData.js';
import { ActualPitch } from '../data/pitchData.js';
import { League, LeagueGameState } from '../gameTypes.js';
import { getActivePlayerPerks } from './ratings.js';

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
