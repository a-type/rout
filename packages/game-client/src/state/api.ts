import { LongGameError } from '@long-game/common';
import { hcWithType as gameSessionHc } from '@long-game/services/game-session';
import { fetch } from '../fetch';

export const gameSessionRpc = gameSessionHc(
  import.meta.env.VITE_GAME_SESSION_API_ORIGIN,
  { fetch },
);

export async function getSummary(gameSessionId: string) {
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

export async function getPlayers(gameSessionId: string) {
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
