import { assert } from '@a-type/utils';
import { builder } from '../builder.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import {
  id,
  type GameSessionMembership as DBGameSessionMembership,
} from '@long-game/db';
import { assignTypeName, hasTypeName } from '../relay.js';
import { GameSession } from './gameSession.js';
import { User } from './user.js';
import { z } from 'zod';
import { validateAccessToGameSession } from '../../data/gameSession.js';
import { LongGameError } from '@long-game/common';
import { decodeGlobalID } from '@pothos/plugin-relay';

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
            gameSessionId: z.string(),
            userId: z.string(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const gameSessionId = decodeGlobalID(input.gameSessionId).id;
      const userId = decodeGlobalID(input.userId).id;
      await validateAccessToGameSession(gameSessionId, ctx.session);

      console.log(gameSessionId, userId);

      const membership = await ctx.db
        .insertInto('GameSessionMembership')
        .values({
          id: id(),
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
            inviteId: z.string(),
            response: z.enum(['accepted', 'declined']),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);

      const membership = await ctx.db
        .selectFrom('GameSessionMembership')
        .where('id', '=', decodeGlobalID(input.inviteId).id)
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
        .where('GameSessionMembership.id', 'in', ids)
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
    gameSessionId: t.id({
      required: true,
    }),
    userId: t.id({
      required: true,
    }),
  }),
});

builder.inputType('RespondToGameInviteInput', {
  fields: (t) => ({
    inviteId: t.id({
      required: true,
    }),
    response: t.field({
      type: GameInviteResponse,
      required: true,
    }),
  }),
});
