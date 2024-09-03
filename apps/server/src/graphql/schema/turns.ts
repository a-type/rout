import { assert } from '@a-type/utils';
import { LongGameError } from '@long-game/common';
import { getGameState } from '@long-game/game-state';
import { builder } from '../builder.js';
import { assignTypeName } from '../relay.js';
import { GameSession } from './gameSession.js';
import { decodeGlobalID } from '@pothos/plugin-relay';

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
      const gameSessionId = decodeGlobalID(input.gameSessionId).id;

      const gameSession = await ctx.dataLoaders.gameSession.load(gameSessionId);

      const state = await getGameState(gameSession, new Date());

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

      // in one transaction, delete existing moves from this player
      // in the timerange and insert the provided ones
      await ctx.db.transaction().execute(async (trx) => {
        await trx
          .insertInto('GameTurn')
          .values({
            // provide a new ID - otherwise users could
            // overwrite each other's moves or a move
            // from a previous turn (if constraints change)
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
          .execute();
      });

      // ctx.pubsub.publish(EVENT_LABELS.gameStateChanged(gameSessionId), {
      //   //TODO: this.
      // })

      return {
        gameSessionId,
      };
    },
  }),
}));

builder.objectType('Turn', {
  fields: (t) => ({
    userId: t.exposeString('userId', { nullable: false }),
    data: t.field({
      type: 'JSON',
      resolve: (obj) => obj.data,
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
  }),
});

builder.inputType('SubmitTurnInput', {
  fields: (t) => ({
    gameSessionId: t.string({ required: true }),
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
