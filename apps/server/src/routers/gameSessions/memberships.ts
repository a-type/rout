import { Hono } from 'hono';
import { Env } from '../../config/ctx.js';
import { LongGameError } from '@long-game/common';
import { dateTime, db, id } from '@long-game/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const membershipsRouter = new Hono<Env>()
  .get('/', async (ctx) => {
    const session = ctx.get('session');

    if (!session) {
      throw new LongGameError(LongGameError.Code.Unauthorized);
    }

    const memberships = await db
      .selectFrom('GameSessionMembership')
      .where('userId', '=', session.userId)
      .innerJoin(
        'GameSession',
        'GameSession.id',
        'GameSessionMembership.gameSessionId',
      )
      .select([
        'GameSessionMembership.id',
        'GameSessionMembership.gameSessionId',
        'GameSession.startedAt',
        'GameSessionMembership.status as membershipStatus',
        'GameSession.gameId',
        'GameSessionMembership.createdAt',
      ])
      .execute();

    return ctx.json(memberships);
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        userId: z.string(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const gameSessionId = ctx.get('gameSessionId');

      if (!session) {
        throw new LongGameError(LongGameError.Code.Unauthorized);
      }

      const { userId } = ctx.req.valid('json');

      const gameSession = await db
        .selectFrom('GameSession')
        .where('GameSession.id', '=', gameSessionId)
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSessionMembership.userId', '=', session.userId)
        .select([
          'GameSessionMembership.status as membershipStatus',
          'GameSession.startedAt',
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new LongGameError(LongGameError.Code.NotFound);
      }

      if (gameSession.startedAt) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Cannot join a game session that has already started.',
        );
      }

      if (gameSession.membershipStatus !== 'accepted') {
        throw new LongGameError(
          LongGameError.Code.Forbidden,
          'You must join this game before inviting new players',
        );
      }

      const friendship = await db
        .selectFrom('FriendshipView')
        .where('userId', '=', session.userId)
        .where('friendId', '=', userId)
        .select(['status'])
        .executeTakeFirst();

      if (!friendship || friendship.status !== 'accepted') {
        throw new LongGameError(
          LongGameError.Code.Forbidden,
          'You must be friends with this user to invite them to a game session.',
        );
      }

      const existingMembership = await db
        .selectFrom('GameSessionMembership')
        .where('gameSessionId', '=', gameSessionId)
        .where('userId', '=', userId)
        .select(['id'])
        .executeTakeFirst();

      if (existingMembership) {
        throw new LongGameError(
          LongGameError.Code.Conflict,
          'This user is already a member of this game session.',
        );
      }

      await db
        .insertInto('GameSessionMembership')
        .values({
          id: id(),
          gameSessionId,
          inviterId: session.userId,
          userId,
          status: 'pending',
        })
        .execute();

      return ctx.json({ success: true });
    },
  )
  .post(
    '/:id/respond',
    zValidator(
      'json',
      z.object({
        response: z.enum(['accepted', 'declined']),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const id = ctx.req.param('id');

      if (!session) {
        throw new LongGameError(LongGameError.Code.Unauthorized);
      }

      const { response } = ctx.req.valid('json');

      const gameSession = await db
        .selectFrom('GameSession')
        .where('GameSession.id', '=', id)
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSessionMembership.userId', '=', session.userId)
        .select([
          'GameSessionMembership.status as membershipStatus',
          'GameSession.startedAt',
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new LongGameError(LongGameError.Code.NotFound);
      }

      if (gameSession.membershipStatus !== 'pending') {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Invite is no longer pending',
        );
      }

      if (!!gameSession.startedAt) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game session is already in progress.',
        );
      }
      await db
        .updateTable('GameSessionMembership')
        .set({
          status: response,
          claimedAt: dateTime(),
        })
        .where('gameSessionId', '=', id)
        .where('userId', '=', session.userId)
        .execute();

      return ctx.json({ success: true });
    },
  );
