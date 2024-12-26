import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import {
  dateTime,
  genericId,
  id,
  isPrefixedId,
  jsonArrayFrom,
  PrefixedId,
} from '@long-game/db';
import { getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import { z } from 'zod';
import { builder } from '../builder.js';
import { assignTypeName, hasTypeName } from '../relay.js';
import { GameSessionMembership } from './gameSessionMembership.js';
import {
  encodeGameSessionStateId,
  GameSessionState,
} from './gameSessionState.js';

builder.queryFields((t) => ({
  gameSession: t.field({
    type: GameSession,
    args: {
      id: t.arg.prefixedId({ required: true, prefix: 'gs' }),
    },
    resolve: async (_, { id }) => {
      return id;
    },
  }),
}));

builder.mutationFields((t) => ({
  prepareGameSession: t.field({
    type: GameSession,
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'PrepareGameSessionInput',
        required: true,
        validate: {
          schema: z.object({
            gameId: z.string(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const session = ctx.session;
      const game = games[input.gameId];
      const gameSession = await ctx.db.transaction().execute(async (db) => {
        const gameSession = await db
          .insertInto('GameSession')
          .values({
            id: id('gs'),
            gameId: game.id,
            gameVersion: getLatestVersion(game).version,
            // TODO: configurable + automatic detection?
            timezone: 'America/New_York',
            randomSeed: genericId(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // seed own membership
        await db
          .insertInto('GameSessionMembership')
          .values({
            id: id('gsm'),
            gameSessionId: gameSession.id,
            userId: session.userId,
            inviterId: session.userId,
            status: 'accepted',
          })
          .execute();
        return gameSession;
      });

      return assignTypeName('GameSession')(gameSession);
    },
  }),

  updateGameSession: t.field({
    type: 'UpdateGameSessionResult',
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'UpdateGameSessionInput',
        required: true,
        validate: {
          schema: z.object({
            gameSessionId: z.custom<PrefixedId<'gs'>>((v) =>
              isPrefixedId(v, 'gs'),
            ),
            gameId: z.string(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const { gameSessionId, gameId } = input;

      const gameSession = await ctx.db
        .selectFrom('GameSession')
        .innerJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSession.id', '=', gameSessionId)
        .where('GameSessionMembership.userId', '=', ctx.session.userId)
        .select(['gameId', 'startedAt'])
        .executeTakeFirst();

      if (!gameSession) {
        throw new LongGameError(LongGameError.Code.NotFound);
      }

      if (gameId && !!gameSession.startedAt) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Cannot change game type when game is already started.',
        );
      }

      // TODO: more validation

      const updated = await ctx.db
        .updateTable('GameSession')
        .set({
          gameId,
        })
        .where('GameSession.id', '=', gameSessionId)
        .returningAll()
        .executeTakeFirstOrThrow(
          () => new LongGameError(LongGameError.Code.NotFound),
        );

      return {
        gameSession: assignTypeName('GameSession')(updated),
      };
    },
  }),

  startGameSession: t.field({
    type: GameSession,
    authScopes: {
      user: true,
    },
    args: {
      gameSessionId: t.arg.prefixedId({ prefix: 'gs', required: true }),
    },
    resolve: async (_, { gameSessionId }, ctx) => {
      assert(ctx.session);

      const gameSession = await ctx.db
        .selectFrom('GameSession')
        .leftJoin(
          'GameSessionMembership',
          'GameSession.id',
          'GameSessionMembership.gameSessionId',
        )
        .where('GameSession.id', '=', gameSessionId)
        .where('GameSessionMembership.userId', '=', ctx.session.userId)
        .select([
          'GameSession.id',
          'GameSession.startedAt',
          'GameSession.gameId',
          'GameSession.randomSeed',
        ])
        .select((eb) => [
          jsonArrayFrom(
            eb
              .selectFrom('GameSessionMembership')
              .select('GameSessionMembership.userId as id')
              .whereRef('gameSessionId', '=', 'GameSession.id'),
          ).as('members'),
        ])
        .executeTakeFirst();

      if (!gameSession) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          'Game session not found',
        );
      }

      if (!!gameSession.startedAt) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game session already started',
        );
      }

      const gameModule = games[gameSession.gameId];
      if (!gameModule) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          `Game module not found for game ID ${gameSession.gameId}`,
        );
      }
      const gameDefinition = getLatestVersion(gameModule);

      const updated = await ctx.db
        .updateTable('GameSession')
        .set({
          startedAt: dateTime(),
          gameVersion: gameDefinition.version,
        })
        .where('GameSession.id', '=', gameSessionId)
        .returningAll()
        .executeTakeFirstOrThrow(
          () => new LongGameError(LongGameError.Code.NotFound),
        );

      return assignTypeName('GameSession')(updated);
    },
  }),
}));

// OUTPUT TYPES
export const GameSession = builder.loadableNodeRef('GameSession', {
  load: async (ids, ctx) => {
    return ctx.dataLoaders.gameSession.loadMany(ids);
  },
  id: {
    resolve: (obj) => obj.id,
  },
});
GameSession.implement({
  description: 'An instance of a game being played by a group of users.',
  isTypeOf: hasTypeName('GameSession'),
  fields: (t) => ({
    gameId: t.exposeID('gameId', { nullable: false }),
    gameVersion: t.exposeString('gameVersion', { nullable: false }),
    members: t.field({
      type: [GameSessionMembership],
      nullable: false,
      resolve: async (gameSession, _, ctx) => {
        const memberships = await ctx.db
          .selectFrom('GameSessionMembership')
          .where('gameSessionId', '=', gameSession.id)
          .selectAll()
          .execute();

        return memberships.map(assignTypeName('GameSessionMembership'));
      },
    }),
    state: t.field({
      type: GameSessionState,
      nullable: false,
      resolve: async (gameSession, _, ctx) => {
        return encodeGameSessionStateId(gameSession.id);
      },
    }),
    chat: t.field({
      type: 'GameChat',
      nullable: false,
      resolve: (gameSession, args, ctx) => ({ gameSessionId: gameSession.id }),
    }),
    postGame: t.field({
      type: 'GameSessionPostGame',
      nullable: true,
      resolve: async (gameSession, _, ctx) => {
        const state = await ctx.dataLoaders.gameSessionState.load(
          gameSession.id,
        );
        const game = games[gameSession.gameId];
        if (!game) {
          return null;
        }
        const status = state.status;
        if (status.status !== 'completed') {
          return null;
        }
        return {
          globalState: state.globalState,
          winnerIds: status.winnerIds as any,
        };
      },
    }),
    createdAt: t.field({
      type: 'DateTime',
      nullable: false,
      resolve: (gameSession) => new Date(gameSession.createdAt),
    }),
    updatedAt: t.field({
      type: 'DateTime',
      nullable: false,
      resolve: (gameSession) => new Date(gameSession.updatedAt),
    }),
    startedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (gameSession) =>
        gameSession.startedAt ? new Date(gameSession.startedAt) : null,
    }),
    timezone: t.exposeString('timezone', { nullable: false }),
  }),
});

builder.objectType('GameSessionPostGame', {
  fields: (t) => ({
    globalState: t.field({
      type: 'JSON',
      resolve: async (postGame, _, ctx) => {
        return postGame.globalState;
      },
    }),
    winnerIds: t.field({
      type: ['ID'],
      resolve: async (postGame, _, ctx) => {
        return postGame.winnerIds;
      },
    }),
  }),
});

builder.objectType('UpdateGameSessionResult', {
  fields: (t) => ({
    gameSession: t.field({
      type: GameSession,
      nullable: false,
      resolve: (obj) => obj.gameSession,
    }),
  }),
});

// INPUT TYPES
builder.inputType('PrepareGameSessionInput', {
  fields: (t) => ({
    gameId: t.field({
      type: 'ID',
      description: 'The ID of the game to play.',
      required: true,
    }),
  }),
});

builder.inputType('UpdateGameSessionInput', {
  fields: (t) => ({
    gameSessionId: t.prefixedId({
      prefix: 'gs',
      description: 'The ID of the game session to update.',
      required: true,
    }),
    gameId: t.field({
      type: 'ID',
      description: 'The ID of the game to play.',
      required: true,
    }),
  }),
});
