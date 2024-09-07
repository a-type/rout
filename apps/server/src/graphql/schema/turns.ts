import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import { builder } from '../builder.js';
import { assignTypeName } from '../relay.js';
import { GameSession } from './gameSession.js';
import { encodeGameSessionStateId } from './gameSessionState.js';

builder.mutationFields((t) => ({
  submitTurn: t.field({
    type: 'SubmitTurnResult',
    args: {
      input: t.arg({
        type: 'SubmitTurnInput',
        required: true,
      }),
    },
    resolve: async (_, { input }, ctx) => {
      assert(ctx.session);
      const { userId } = ctx.session;
      const { turn } = input;
      const gameSessionId = input.gameSessionId;
      const state = await ctx.dataLoaders.gameSessionState.load(
        encodeGameSessionStateId(gameSessionId),
      );

      if (!state) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Could not load game state',
        );
      }

      const {
        globalState,
        gameDefinition,
        currentRound,
        previousRounds,
        members,
        rounds,
      } = state;

      // validate the game status - cannot make moves on an ended game
      const status = gameDefinition.getStatus({
        globalState,
        rounds: previousRounds,
        members,
      });
      if (status.status !== 'active') {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          'Game is not active',
        );
      }

      // based on the current confirmed game state (no current round moves),
      // compute the player's view of the state
      const playerState = gameDefinition.getPlayerState({
        globalState,
        playerId: userId,
        roundIndex: currentRound.roundIndex,
        members,
        rounds,
      });

      // then apply these moves to that state and see if they're valid
      const validationMessage = gameDefinition.validateTurn({
        playerState,
        turn: {
          data: null,
          ...turn,
          userId: userId,
        },
        members,
        roundIndex: currentRound.roundIndex,
      });

      if (validationMessage) {
        throw new LongGameError(
          LongGameError.Code.BadRequest,
          validationMessage,
        );
      }

      const createdTurn = await ctx.db
        .insertInto('GameTurn')
        .values({
          gameSessionId,
          userId,
          data: turn.data,
          roundIndex: currentRound.roundIndex,
        })
        .onConflict((bld) => {
          // resolve conflicts on composite primary key by updating
          // turn data to the newly supplied turn
          return bld
            .columns(['gameSessionId', 'userId', 'roundIndex'])
            .doUpdateSet({
              data: turn.data,
            });
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // apply the turn to the game state before propagating
      state.addTurn(createdTurn);

      ctx.pubsub.publishGameStateChanged({
        gameSessionState: state,
      });

      return {
        gameSessionId,
        gameSessionState: state,
      };
    },
  }),
}));

builder.objectType('Turn', {
  fields: (t) => ({
    userId: t.field({
      type: 'ID',
      resolve: (obj) => obj.userId,
      nullable: false,
    }),
    data: t.field({
      type: 'JSON',
      resolve: (obj) => obj.data,
      nullable: false,
    }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (obj) => new Date(obj.createdAt),
      nullable: false,
    }),
  }),
});

builder.objectType('Round', {
  fields: (t) => ({
    roundIndex: t.exposeInt('roundIndex'),
    turns: t.field({
      type: ['Turn'],
      resolve: (obj) => obj.turns.map(assignTypeName('Turn')),
    }),
  }),
});

builder.objectType('SubmitTurnResult', {
  fields: (t) => ({
    gameSession: t.field({
      type: GameSession,
      resolve: (obj) => obj.gameSessionId,
    }),
    gameSessionState: t.field({
      type: 'GameSessionState',
      resolve: (obj) => obj.gameSessionState,
    }),
  }),
});

builder.inputType('SubmitTurnInput', {
  fields: (t) => ({
    gameSessionId: t.prefixedId({
      required: true,
      prefix: 'gs',
    }),
    turn: t.field({
      type: 'GameTurnInput',
      required: true,
    }),
  }),
});

builder.inputType('GameTurnInput', {
  fields: (t) => ({
    data: t.field({
      type: 'JSON',
      required: true,
    }),
  }),
});
