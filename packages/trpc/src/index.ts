import { Move } from '@long-game/game-definition';
import { publicProcedure, router } from './util.js';
import * as zod from 'zod';

const appRouter = router({
  /**
   * List all game sessions the player is participating in
   */
  sessions: publicProcedure.query(async (opts) => {}),
  /**
   * Get the current state of a game session
   */
  gameState: publicProcedure
    .input(
      zod.object({
        sessionId: zod.string(),
      }),
    )
    .query(
      async (
        opts,
      ): Promise<{
        state: unknown;
        moves: Move<any>[];
      }> => {
        return {
          state: null,
          moves: [],
        };
      },
    ),
  /**
   * Submit new moves for this round of a game session.
   * Overwrites any previously submitted moves this round.
   */
  submitMoves: publicProcedure
    .input(
      zod.object({
        moves: zod.array(
          zod.object({
            id: zod.string(),
            data: zod.unknown(),
          }),
        ),
      }),
    )
    .mutation(async (opts) => {}),
});
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
