import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { friendshipsRouter } from './friendships.js';
import { gameSessionsRouter } from './gameSessions.js';
import { router } from './util.js';
import { chatRouter } from './chat.js';

export const appRouter = router({
  friendships: friendshipsRouter,
  gameSessions: gameSessionsRouter,
  chat: chatRouter,
});
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;
