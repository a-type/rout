import { GameRoundSummary, LongGameError, PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
} from '@long-game/game-definition';
import { hcWithType as apiHc } from '@long-game/service-api/client';
import { publicSdk } from '../api/index.js';
import { API_ORIGIN } from '../config.js';
import { fetch } from '../fetch.js';

export const apiRpc = apiHc(API_ORIGIN, {
  fetch,
});

export async function getSummary(gameSessionId: PrefixedId<'gs'>) {
  return publicSdk.getGameSessionDetails.run({ id: gameSessionId });
}

export async function getPlayers(gameSessionId: PrefixedId<'gs'>) {
  return publicSdk.getGameSessionMembers.run({ id: gameSessionId });
}

export async function startGame(gameSessionId: PrefixedId<'gs'>) {
  return publicSdk.run(publicSdk.startGameSession, { id: gameSessionId });
}

export async function resolveGameId(gameIdOrAlias: string) {
  return publicSdk.getResolvedGameIdFromAlias.run({ aliasId: gameIdOrAlias });
}

export async function getPublicRound<TGame extends GameDefinition>(
  gameSessionId: PrefixedId<'gs'>,
  roundIndex: number,
) {
  const res = await publicSdk.getGameSessionRound.run({
    id: gameSessionId,
    index: roundIndex,
  });
  return res as GameRoundSummary<
    GetTurnData<TGame>,
    GetPublicTurnData<TGame>,
    GetPlayerState<TGame>
  >;
}

export async function getPostgame(gameSessionId: PrefixedId<'gs'>) {
  return publicSdk.getGameSessionPostgame.run({ id: gameSessionId });
}

// only works in DEV_MODE. returns raw private turn data
export async function getDevModeTurns(gameSessionId: PrefixedId<'gs'>) {
  const res = await apiRpc.gameSessions[':id'].turns.$get({
    param: { id: gameSessionId },
  });
  if (!res.ok) {
    throw new LongGameError(LongGameError.Code.Unknown, 'Failed to get turns');
  }
  return await res.json();
}
