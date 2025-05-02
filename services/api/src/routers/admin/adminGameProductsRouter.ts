import { zValidator } from '@hono/zod-validator';
import { idShapes, wrapRpcData } from '@long-game/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../config/ctx';

export const adminGameProductsRouter = new Hono<Env>()
  .post('/', async (ctx) => {
    const product = await ctx.env.ADMIN_STORE.createGameProduct();
    return ctx.json(wrapRpcData(product));
  })
  .put(
    '/:productId',
    zValidator('param', z.object({ productId: idShapes.GameProduct })),
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
        priceCents: z.number().int().gte(0).optional(),
        description: z.string().optional(),
        publishedAt: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const { productId } = ctx.req.valid('param');
      const { name, priceCents, description, publishedAt } =
        ctx.req.valid('json');
      const product = await ctx.env.ADMIN_STORE.updateGameProduct(productId, {
        name,
        priceCents,
        description,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      });
      return ctx.json(wrapRpcData(product));
    },
  )
  .put(
    '/:productId/items',
    zValidator('param', z.object({ productId: idShapes.GameProduct })),
    zValidator('json', z.object({ gameId: z.string() })),
    async (ctx) => {
      const { productId } = ctx.req.valid('param');
      const { gameId } = ctx.req.valid('json');
      const item = await ctx.env.ADMIN_STORE.addGameProductItem(
        productId,
        gameId,
      );
      return ctx.json(wrapRpcData(item));
    },
  )
  .delete(
    '/:productId/items/:itemId',
    zValidator(
      'param',
      z.object({
        productId: idShapes.GameProduct,
        itemId: idShapes.GameProductItem,
      }),
    ),
    async (ctx) => {
      const { itemId } = ctx.req.valid('param');
      await ctx.env.ADMIN_STORE.removeGameProductItem(itemId);
      return ctx.json({ success: true });
    },
  )
  .delete(
    '/:productId',
    zValidator('param', z.object({ productId: idShapes.GameProduct })),
    async (ctx) => {
      // we cannot delete products owned by users, so we unpublish them.
      const { productId } = ctx.req.valid('param');
      const isOwned = await ctx.env.ADMIN_STORE.isGameProductOwnedByUsers(
        productId,
      );
      if (isOwned) {
        await ctx.env.ADMIN_STORE.unpublishGameProduct(productId);
      } else {
        await ctx.env.ADMIN_STORE.deleteGameProduct(productId);
      }
      return ctx.json({ success: true });
    },
  );
