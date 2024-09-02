import { builder } from '../builder.js';

export const GameSessionStatusValue = builder.enumType(
  'GameSessionStatusValue',
  {
    values: ['pending', 'active', 'completed'],
  },
);

export const GameSessionStatus = builder.objectType('GameSessionStatus', {
  fields: (t) => ({
    status: t.field({
      type: GameSessionStatusValue,
      resolve: (obj) => obj.status,
    }),
    winnerIds: t.exposeStringList('winnerIds', {
      nullable: true,
    }),
  }),
});
