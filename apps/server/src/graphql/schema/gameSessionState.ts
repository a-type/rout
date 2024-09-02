import { builder } from '../builder.js';
import { assignTypeName } from '../relay.js';

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
          playerId: userId,
          roundIndex: state.currentRound.roundIndex,
          members: state.members,
        });
      },
    }),
    currentTurn: t.field({
      type: 'Turn',
      nullable: true,
      authScopes: { user: true },
      resolve: async (state, _, ctx) => {
        const turn = state.currentRound.turns.find(
          (turn) => turn.userId === ctx.session!.userId,
        );
        if (turn) {
          return assignTypeName('Turn')(turn);
        }
        return null;
      },
    }),
    rounds: t.field({
      type: ['Round'],
      authScopes: { user: true },
      resolve: (state) => state.rounds,
    }),
  }),
});

export function encodeGameSessionStateId(gameSessionId: string) {
  return gameSessionId;
}

export function decodeGameSessionStateId(id: string) {
  return id;
}
