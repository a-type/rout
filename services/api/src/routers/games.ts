import { zValidator } from '@hono/zod-validator';
import {
  idShapes,
  LongGameError,
  PrefixedId,
  wrapRpcData,
} from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx';
import { sessionMiddleware, userStoreMiddleware } from '../middleware';

export const gamesRouter = new Hono<Env>()
  // basically useful for correcting a lack of free games which should be
  // provided on signup
  .post('/applyFree', userStoreMiddleware, async (ctx) => {
    const session = ctx.get('session');
    const userId = session.userId;
    await ctx.env.ADMIN_STORE.applyFreeGames(userId);
    return ctx.json({ success: true });
  })
  .get('/owned', userStoreMiddleware, async (ctx) => {
    const gameIds = await ctx.get('userStore').getOwnedGames();
    return ctx.json(wrapRpcData(gameIds));
  })
  .get(
    '/products',
    sessionMiddleware,
    zValidator(
      'query',
      z.object({
        tags: z
          .preprocess((v) => {
            if (Array.isArray(v)) {
              return v;
            }
            return [v];
          }, z.string().array())
          .optional(),
      }),
    ),
    async (ctx) => {
      const { tags } = ctx.req.valid('query');
      const products = await ctx.env.PUBLIC_STORE.getGameProducts({ tags });

      // mark purchases for logged in users
      let purchasedProductIds: PrefixedId<'gp'>[] = [];
      const session = ctx.get('session');
      if (session) {
        const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(
          session.userId,
        );
        purchasedProductIds = await userStore.getOwnedGameProducts();
      }
      console.log(purchasedProductIds);
      return ctx.json(
        products.map((p) => ({
          ...p,
          isOwned: purchasedProductIds.includes(p.id as PrefixedId<'gp'>),
        })),
      );
    },
  )
  .get(
    '/products/:productId',
    zValidator('param', z.object({ productId: idShapes.GameProduct })),
    async (ctx) => {
      const { productId } = ctx.req.valid('param');
      const product = await ctx.env.PUBLIC_STORE.getGameProduct(productId);
      if (!product) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          `Game product not found: ${productId}`,
        );
      }
      return ctx.json(wrapRpcData(product));
    },
  );
