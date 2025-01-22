import { wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { userStoreMiddleware } from '../../middleware';
import { EnvWith } from '../config/ctx';

export const gameSessionsRouter = new Hono<EnvWith<'session'>>()
  .use(userStoreMiddleware)
  .get('/', async (ctx) => {
    const userStore = ctx.get('userStore');
    const sessions = await userStore.getGameSessions();
    return ctx.json(wrapRpcData(sessions));
  });
