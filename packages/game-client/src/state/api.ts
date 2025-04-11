import { GameRoundSummary, LongGameError, PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
} from '@long-game/game-definition';
import { hcWithType as apiHc } from '@long-game/service-api';
import type { InferResponseType } from 'hono/client';
import { fetch } from '../fetch';

export const apiRpc = apiHc(import.meta.env.VITE_PUBLIC_API_ORIGIN, {
  fetch,
});

export async function getSummary(gameSessionId: PrefixedId<'gs'>) {
  const initRes = await apiRpc.gameSessions[':id'].$get({
    param: { id: gameSessionId },
  });
  if (!initRes.ok) {
    throw new LongGameError(
      LongGameError.Code.Unknown,
      'Failed to get game session init',
    );
  }
  const init = await initRes.json();
  return init;
}

export async function getPlayers(gameSessionId: PrefixedId<'gs'>) {
  const res = await apiRpc.gameSessions[':id'].members.$get({
    param: { id: gameSessionId },
  });
  if (!res.ok) {
    throw new LongGameError(
      LongGameError.Code.Unknown,
      'Failed to get players',
    );
  }
  return await res.json();
}

// unfortunately need to fix the type a bit here
export type PublicRoundResponse = InferResponseType<
  (typeof apiRpc)['gameSessions'][':id']['rounds'][':index']['$get']
>;
export async function getPublicRound<TGame extends GameDefinition>(
  gameSessionId: PrefixedId<'gs'>,
  roundIndex: number,
) {
  const res = await apiRpc['gameSessions'][':id'].rounds[':index'].$get({
    param: { id: gameSessionId, index: roundIndex.toString() },
  });
  if (!res.ok) {
    throw new LongGameError(
      LongGameError.Code.Unknown,
      'Failed to get public round',
    );
  }
  return (await res.json()) as unknown as GameRoundSummary<
    GetTurnData<TGame>,
    GetPublicTurnData<TGame>,
    GetPlayerState<TGame>
  >;
}

export async function getPostgame(gameSessionId: PrefixedId<'gs'>) {
  const res = await apiRpc.gameSessions[':id'].postgame.$get({
    param: { id: gameSessionId },
  });
  if (!res.ok) {
    throw new LongGameError(
      LongGameError.Code.Unknown,
      'Failed to get global state',
    );
  }
  return (await res.json()) as { globalState: any; rounds: any[] };
}
