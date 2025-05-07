import { z } from 'zod';
import { idShapes } from './ids';

export const gameSessionPlayerStatusShape = z.object({
  online: z.boolean(),
});
export type GameSessionPlayerStatus = z.infer<
  typeof gameSessionPlayerStatusShape
>;

export const gameStatusShape = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('pending'),
  }),
  z.object({
    status: z.literal('active'),
  }),
  z.object({
    status: z.literal('complete'),
    winnerIds: z.array(idShapes.User),
  }),
]);
export type GameStatus = z.infer<typeof gameStatusShape>;

export type GameStatusValue = GameStatus['status'];
