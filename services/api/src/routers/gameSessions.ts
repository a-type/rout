import { zValidator } from '@hono/zod-validator';
import { id, LongGameError, wrapRpcData } from '@long-game/common';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { Hono } from 'hono';
import { z } from 'zod';
import { EnvWith } from '../config/ctx';
import { userStoreMiddleware } from '../middleware';
import { getGameSessionState } from '../services/gameSessions';

import { UserStore } from '@long-game/service-db';
import { RpcStub } from 'cloudflare:workers';
import { GameSessionState } from '../durableObjects/GameSessionState';
import { gameSessionRouter } from './gameSession';

export const gameSessionsRouter = new Hono<EnvWith<'session'>>()
  .use(userStoreMiddleware)
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        status: z.enum(['active', 'completed', 'pending']).optional(),
      }),
    ),
    async (ctx) => {
      const userStore = ctx.get('userStore');
      const {
        results: filteredSessions,
        errors,
        pageInfo,
      } = await mapAndFilterGameSessions(
        ctx.req.valid('query'),
        userStore,
        ctx.env,
      );

      for (const err of errors) {
        console.error(err);
      }

      return ctx.json({
        sessions: filteredSessions,
        pageInfo,
        errors: errors.map((e) => e?.message),
      });
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gameId: z.string(),
      }),
    ),
    async (ctx) => {
      const { gameId } = ctx.req.valid('json');
      const game = games[gameId];

      if (!game) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game not found',
        );
      }
      const gameDefinition = getLatestVersion(game);

      const sessionId = id('gs');
      const durableObjectId = ctx.env.GAME_SESSION_STATE.idFromName(sessionId);
      const sessionState = await ctx.env.GAME_SESSION_STATE.get(
        durableObjectId,
      );
      const randomSeed = crypto.randomUUID();
      const userId = ctx.get('session').userId;
      await sessionState.initialize({
        id: sessionId,
        randomSeed,
        gameId: game.id,
        gameVersion: gameDefinition.version,
        members: [
          {
            id: userId,
          },
        ],
        // TODO: configurable / automatic detection
        timezone: 'America/New_York',
      });

      // insert founding membership so the user can find this session
      const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(userId);
      await userStore.insertFoundingGameMembership(sessionId);

      return ctx.json({ sessionId });
    },
  )
  .route('/:id', gameSessionRouter);

/**
 * Since sessions are filtered post-facto (because we have to dip in DOs to get the status),
 * we sometimes have to fetch an extra page or more to get the desired number of sessions.
 */
async function mapAndFilterGameSessions(
  filter: {
    invitationStatus?: 'pending' | 'accepted' | 'declined' | 'expired';
    status?: 'active' | 'completed' | 'pending';
    first?: number;
    after?: string;
  },
  userStore: RpcStub<UserStore>,
  env: ApiBindings,
): Promise<{
  errors: Error[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  results: Awaited<ReturnType<GameSessionState['getSummary']>>[];
}> {
  const { results: invitations, pageInfo } = await userStore.getGameSessions({
    status: filter.invitationStatus,
    first: filter.first,
    after: filter.after,
  });

  const sessionDOs = await Promise.allSettled(
    invitations.map(async ({ gameSessionId }) => {
      const state = await getGameSessionState(gameSessionId, env);
      return wrapRpcData(await state.getSummary());
    }),
  );

  const sessionStates = sessionDOs
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const errors = sessionDOs
    .map((r) => (r.status === 'rejected' ? r.reason : null))
    .filter((e): e is Error => e !== null);

  const statusFilter = filter.status;
  let filteredSessions = sessionStates;
  if (statusFilter) {
    filteredSessions = sessionStates.filter((s) => {
      switch (statusFilter) {
        case 'active':
          return s.status.status === 'active';
        case 'completed':
          return s.status.status === 'completed';
        case 'pending':
          return s.status.status === 'pending';
      }
    });
  }

  if (filter.first) {
    if (
      filteredSessions.length < filter.first &&
      pageInfo.hasNextPage &&
      pageInfo.endCursor
    ) {
      const nextPage = await mapAndFilterGameSessions(
        { ...filter, first: filter.first, after: pageInfo.endCursor },
        userStore,
        env,
      );
      filteredSessions = filteredSessions.concat(nextPage.results);
      errors.push(...nextPage.errors);
    }
  }

  return {
    results: filteredSessions,
    errors,
    pageInfo,
  };
}
