import { z } from 'zod';
import { idShapes } from './ids';

export const gameSessionPlayerStatusShape = z.object({
  online: z.boolean(),
  pendingTurn: z.boolean(),
});
export type GameSessionPlayerStatus = z.infer<
  typeof gameSessionPlayerStatusShape
>;

export const gameSessionPlayerStatusUpdateShape =
  gameSessionPlayerStatusShape.partial();
export type GameSessionPlayerStatusUpdate = z.infer<
  typeof gameSessionPlayerStatusUpdateShape
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
  z.object({
    status: z.literal('abandoned'),
  }),
]);
export type GameStatus = z.infer<typeof gameStatusShape>;

export type GameStatusValue = GameStatus['status'];
