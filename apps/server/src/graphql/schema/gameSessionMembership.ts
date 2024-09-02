import { assert } from '@a-type/utils';
import { builder } from '../builder.js';
import { createResults, keyIndexes } from '../dataloaders.js';
import type { GameSessionMembership as DBGameSessionMembership } from '@long-game/db';
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
    status: t.exposeString('status'),
    user: t.field({
      type: User,
      resolve: async (membership, _) => {
        return membership.userId;
      },
    }),
    gameSession: t.field({
      type: GameSession,
      resolve: async (membership, _) => {
        return membership.gameSessionId;
      },
    }),
  }),
});
