import { GameRoundSummary, LongGameError, PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  GetPlayerState,
  GetPublicTurnData,
  GetTurnData,
} from '@long-game/game-definition';
import { hcWithType as gameSessionHc } from '@long-game/services/game-session';
import type { InferResponseType } from 'hono/client';
import { fetch } from '../fetch';

export const gameSessionRpc = gameSessionHc(
  import.meta.env.VITE_GAME_SESSION_API_ORIGIN,
  { fetch },
);

export async function getSummary(gameSessionId: PrefixedId<'gs'>) {
  const initRes = await gameSessionRpc[':id'].$get({
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
  const res = await gameSessionRpc[':id'].members.$get({
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
  (typeof gameSessionRpc)[':id']['rounds'][':index']['$get']
>;
export async function getPublicRound<TGame extends GameDefinition>(
  gameSessionId: PrefixedId<'gs'>,
  roundIndex: number,
) {
  const res = await gameSessionRpc[':id'].rounds[':index'].$get({
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
