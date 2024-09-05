import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import { dateTime, id, jsonArrayFrom } from '@long-game/db';
import { GameRandom, getLatestVersion } from '@long-game/game-definition';
import games from '@long-game/games';
import {
  decodeGlobalID,
  encodeGlobalID,
  resolveCursorConnection,
  ResolveCursorConnectionArgs,
} from '@pothos/plugin-relay';
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
      id: t.arg.globalID({ required: true }),
    },
    resolve: async (_, { id }, ctx) => {
      return id.id;
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
            id: id(),
            gameId: game.id,
            gameVersion: getLatestVersion(game).version,
            // TODO: configurable + automatic detection?
            timezone: 'America/New_York',
            initialState: {},
            randomSeed: id(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // seed own membership
        await db
          .insertInto('GameSessionMembership')
          .values({
            id: id(),
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
    type: GameSession,
    authScopes: {
      user: true,
    },
    args: {
      input: t.arg({
        type: 'UpdateGameSessionInput',
        required: true,
        validate: {
          schema: z.object({
            gameSessionId: z.string(),
            gameId: z.string(),
          }),
        },
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const { gameSessionId: gameSessionIdEncoded, gameId } = input;
      const gameSessionId = decodeGlobalID(gameSessionIdEncoded).id;

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

      return assignTypeName('GameSession')(updated);
    },
  }),

  startGameSession: t.field({
    type: GameSession,
    authScopes: {
      user: true,
    },
    args: {
      gameSessionId: t.arg.globalID({ required: true }),
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
        .where('GameSession.id', '=', gameSessionId.id)
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
          initialState: gameDefinition.getInitialGlobalState({
            // altering the seed here so that the first moves don't receive
            // the same random values as the initial state.
            random: new GameRandom(gameSession.randomSeed + 'INITIAL'),
            members: gameSession.members.map(({ id }) => ({
              id: id || 'anonymous',
            })),
          }),
          gameVersion: gameDefinition.version,
        })
        .where('GameSession.id', '=', gameSessionId.id)
        .returningAll()
        .executeTakeFirstOrThrow(
          () => new LongGameError(LongGameError.Code.NotFound),
        );

      return assignTypeName('GameSession')(updated);
    },
  }),
}));

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
    chat: t.connection({
      type: 'ChatMessage',
      nullable: false,
      resolve: (gameSession, args, ctx) =>
        resolveCursorConnection(
          {
            args,
            toCursor: (message) => message.createdAt,
          },
          async ({
            before,
            after,
            limit,
            inverted,
          }: ResolveCursorConnectionArgs) => {
            let messagesBuilder = ctx.db
              .selectFrom('ChatMessage')
              .where('gameSessionId', '=', gameSession.id);

            if (before) {
              messagesBuilder = messagesBuilder.where('createdAt', '<', before);
            } else if (after) {
              messagesBuilder = messagesBuilder.where('createdAt', '>', after);
            }

            const messages = await messagesBuilder
              .selectAll()
              .limit(limit)
              .orderBy('createdAt', inverted ? 'desc' : 'asc')
              .execute();

            return messages.map(assignTypeName('ChatMessage'));
          },
        ),
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
          winnerIds: status.winnerIds.map((id) => encodeGlobalID('User', id)),
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
    gameSessionId: t.id({
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
