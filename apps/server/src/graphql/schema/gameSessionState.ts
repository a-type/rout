import { assert } from '@a-type/utils';
import { validateAccessToGameSession } from '../../data/gameSession.js';
import { EVENT_LABELS, GameStateChangedEvent } from '../../services/pubsub.js';
import { builder } from '../builder.js';
import { assignTypeName } from '../relay.js';
import { encodeGlobalID } from '@pothos/plugin-relay';

builder.subscriptionFields((t) => ({
  gameSessionStateChanged: t.field({
    type: 'GameSessionState',
    args: {
      gameSessionId: t.arg.globalID({ required: true }),
    },
    authScopes: { user: true },
    subscribe: async (_, { gameSessionId }, ctx) => {
      // validate access to game session
      await validateAccessToGameSession(gameSessionId.id, ctx.session);
      return ctx.pubsub.events.asyncIterator(
        EVENT_LABELS.gameStateChanged(gameSessionId.id),
      ) as any;
    },
    resolve: (payload: GameStateChangedEvent) => {
      return assignTypeName('GameSessionState')(payload.gameSessionState);
    },
  }),
}));

export const GameSessionState = builder.loadableNodeRef('GameSessionState', {
  load: async (ids, ctx) => {
    return ctx.dataLoaders.gameSessionState.loadMany(ids);
  },
  id: {
    resolve: (obj) => encodeGameSessionStateId(obj.id),
  },
});
GameSessionState.implement({
  fields: (t) => ({
    playerState: t.field({
      type: 'JSON',
      authScopes: { user: true },
      resolve: async (state, _, ctx) => {
        const { userId } = ctx.session!;
        return state.gameDefinition.getPlayerState({
          globalState: state.globalState,
          playerId: encodeGlobalID('User', userId),
          roundIndex: state.currentRound.roundIndex,
          members: state.members,
          rounds: state.rounds,
        });
      },
    }),
    currentTurn: t.field({
      type: 'Turn',
      nullable: true,
      authScopes: { user: true },
      resolve: async (state, _, ctx) => {
        assert(ctx.session);
        const viewerId = encodeGlobalID('User', ctx.session.userId);
        const turn = state.currentRound.turns.find(
          (turn) => turn.userId === viewerId,
        );
        if (turn) {
          return assignTypeName('Turn')(
            state.gameDefinition.getPublicTurn({
              turn,
              globalState: state.globalState,
              viewerId: ctx.session.userId,
            }),
          );
        }
        return null;
      },
    }),
    rounds: t.field({
      type: ['Round'],
      authScopes: { user: true },
      resolve: (state, _, ctx) => {
        assert(ctx.session);
        const userId = ctx.session.userId;
        return state.previousRounds.map((round) =>
          assignTypeName('Round')({
            ...round,
            turns: round.turns.map((turn) =>
              assignTypeName('Turn')(
                state.gameDefinition.getPublicTurn({
                  turn,
                  globalState: state.globalState,
                  viewerId: userId,
                }),
              ),
            ),
          }),
        );
      },
    }),
    status: t.field({
      type: GameSessionStatusValue,
      authScopes: { user: true },
      resolve: (state) => {
        return state.status.status;
      },
    }),
    winnerIds: t.field({
      type: ['ID'],
      authScopes: { user: true },
      resolve: (state) => {
        const status = state.status;
        if (status.status === 'completed') {
          return status.winnerIds.map((id) => encodeGlobalID('User', id));
        }
        return [];
      },
    }),
  }),
});

export function encodeGameSessionStateId(gameSessionId: string) {
  return gameSessionId;
}

export function decodeGameSessionStateId(id: string) {
  return id;
}

export const GameSessionStatusValue = builder.enumType(
  'GameSessionStatusValue',
  {
    values: ['pending', 'active', 'completed'],
  },
);
