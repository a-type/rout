import { db, userNameSelector } from '@long-game/db';
import { router, userProcedure } from './util.js';
import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { refreshSession } from '@long-game/auth';

export const usersRouter = router({
  me: userProcedure.query(async (opts) => {
    const { userId } = opts.ctx.session;
    const user = await db
      .selectFrom('User')
      .where('id', '=', userId)
      .select(['id', 'color'])
      .select(userNameSelector)
      .executeTakeFirst();
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'user not found',
      });
    }
    await refreshSession(opts.ctx.req, opts.ctx.res);
    return user;
  }),

  update: userProcedure
    .input(
      z.object({
        color: z.string().optional(),
        name: z.string().max(255).optional(),
      }),
    )
    .mutation(async (opts) => {
      const { userId } = opts.ctx.session;
      const { color, name } = opts.input;
      const user = await db
        .updateTable('User')
        .set({ color, friendlyName: name })
        .where('id', '=', userId)
        .returning(['id', 'color'])
        .returning(userNameSelector)
        .execute();
      return user;
    }),
});
