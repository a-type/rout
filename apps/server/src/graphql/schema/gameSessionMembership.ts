import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import {
  id,
  isPrefixedId,
  PrefixedId,
  type GameSessionMembership as DBGameSessionMembership,
} from '@long-game/db';
import { z } from 'zod';
import { validateAccessToGameSession } from '../../data/gameSession.js';
import { builder } from '../builder.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import { assignTypeName, hasTypeName } from '../relay.js';
import { GameSession } from './gameSession.js';
import { User } from './user.js';

builder.queryFields((t) => ({
  memberships: t.field({
    type: [GameSessionMembership],
    authScopes: {
      user: true,
    },
    resolve: async (_, __, ctx) => {
      assert(ctx.session);

      const memberships = await ctx.db
        .selectFrom('GameSessionMembership')
        .where('userId', '=', ctx.session.userId)
        .selectAll()
        .execute();

      return memberships.map(assignTypeName('GameSessionMembership'));
    },
  }),
}));

builder.mutationFields((t) => ({
  sendGameInvite: t.field({
    type: 'GameSessionMembership',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'SendGameInviteInput',
        required: true,
        validate: {
          schema: z.object({
            gameSessionId: z.custom<PrefixedId<'gs'>>((v) =>
              isPrefixedId(v, 'gs'),
            ),
            userId: z.custom<PrefixedId<'u'>>((v) => isPrefixedId(v, 'u')),
          }),
        },
      }),
    },
    resolve: async (_, { input: { gameSessionId, userId } }, ctx) => {
      assert(ctx.session);
      await validateAccessToGameSession(gameSessionId, ctx.session);

      const membership = await ctx.db
        .insertInto('GameSessionMembership')
        .values({
          id: id('gsm'),
          gameSessionId: gameSessionId,
          userId,
          status: 'pending',
          inviterId: ctx.session.userId,
        })
        .onConflict((b) => b.columns(['gameSessionId', 'userId']).doNothing())
        .returningAll()
        .executeTakeFirstOrThrow();

      return assignTypeName('GameSessionMembership')(membership);
    },
  }),
  respondToGameInvite: t.field({
    type: 'GameSessionMembership',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'RespondToGameInviteInput',
        required: true,
        validate: {
          schema: z.object({
            inviteId: z.custom<PrefixedId<'gsm'>>((v) =>
              isPrefixedId(v, 'gsm'),
            ),
            response: z.enum(['accepted', 'declined']),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);

      const membership = await ctx.db
        .selectFrom('GameSessionMembership')
        .where('id', '=', input.inviteId)
        .selectAll()
        .executeTakeFirstOrThrow();

      await validateAccessToGameSession(membership.gameSessionId, ctx.session);

      if (membership.userId !== ctx.session.userId) {
        throw new LongGameError(
          LongGameError.Code.Forbidden,
          'You are not authorized to respond to this invitation.',
        );
      }

      if (membership.status !== 'pending') {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'This invitation has already been responded to.',
        );
      }

      await ctx.db
        .updateTable('GameSessionMembership')
        .set({
          status: 'accepted',
        })
        .where('id', '=', membership.id)
        .executeTakeFirstOrThrow();

      return assignTypeName('GameSessionMembership')({
        ...membership,
        status: input.response,
      });
    },
  }),
}));

export const GameSessionMembership = builder.loadableNodeRef(
  'GameSessionMembership',
  {
    load: async (ids, ctx) => {
      if (!ctx.session) {
        // can't view memberships without logging in
        return createResults(ids);
      }

      const memberships = await ctx.db
        .selectFrom('GameSessionMembership')
        .where(
          'GameSessionMembership.id',
          'in',
          ids.filter((id) => isPrefixedId(id, 'gsm')),
        )
        .where('GameSessionMembership.userId', '=', ctx.session.userId)
        .selectAll()
        .execute();

      const indexes = keyIndexes(ids);

      const results = createResults<
        DBGameSessionMembership & { __typename: 'GameSessionMembership' }
      >(ids);

      for (const membership of memberships) {
        results[indexes[membership.id]] = {
          ...membership,
          __typename: 'GameSessionMembership',
        };
      }

      return results;
    },
    id: {
      resolve: (obj) => obj.id,
    },
  },
);
GameSessionMembership.implement({
  description: 'A user who is a member of a game session.',
  isTypeOf: hasTypeName('GameSessionMembership'),
  fields: (t) => ({
    status: t.exposeString('status', {
      nullable: false,
    }),
    user: t.field({
      type: User,
      nullable: false,
      resolve: async (membership, _) => {
        return membership.userId;
      },
    }),
    gameSession: t.field({
      type: GameSession,
      nullable: false,
      resolve: async (membership, _) => {
        return membership.gameSessionId;
      },
    }),
  }),
});

const GameInviteResponse = builder.enumType('GameInviteResponse', {
  values: ['accepted', 'declined', 'pending', 'expired', 'uninvited'],
});

builder.inputType('SendGameInviteInput', {
  fields: (t) => ({
    gameSessionId: t.prefixedId({
      prefix: 'gs',
      required: true,
    }),
    userId: t.prefixedId({
      prefix: 'u',
      required: true,
    }),
  }),
});

builder.inputType('RespondToGameInviteInput', {
  fields: (t) => ({
    inviteId: t.prefixedId({
      prefix: 'gsm',
      required: true,
    }),
    response: t.field({
      type: GameInviteResponse,
      required: true,
    }),
  }),
});
