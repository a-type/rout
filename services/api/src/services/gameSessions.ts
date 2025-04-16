import { PrefixedId } from '@long-game/common';
import { Context } from 'hono';
import { Env } from '../config/ctx';

export async function getGameSessionState(
  id: PrefixedId<'gs'>,
  env: Context<Env>['env'],
) {
  const doId = await env.GAME_SESSION_STATE.idFromName(id);
  return await env.GAME_SESSION_STATE.get(doId);
}
