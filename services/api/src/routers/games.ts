import { zValidator } from '@hono/zod-validator';
import {
  idShapes,
  LongGameError,
  PrefixedId,
  wrapRpcData,
} from '@long-game/common';
import { GameModule } from '@long-game/game-definition';
import games from '@long-game/games';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../config/ctx.js';
import { getGameUrl } from '../config/gameFederation.js';
import { createStripeGameProductCheckoutMetadata } from '../management/stripeMetadata.js';
import { sessionMiddleware, userStoreMiddleware } from '../middleware/index.js';
import { getStripe } from '../services/stripe.js';

function gameSummary(game: GameModule, env: ApiBindings) {
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    tags: game.tags,
    creators: game.creators,
    prerelease: game.prerelease,
    url: getGameUrl(game, env),
    latestVersion: game.versions[game.versions.length - 1].version,
    minimumPlayers: game.versions[game.versions.length - 1].minimumPlayers,
    maximumPlayers: game.versions[game.versions.length - 1].maximumPlayers,
    versions: game.versions.map((def) => ({
      version: def.version,
      minimumPlayers: def.minimumPlayers,
      maximumPlayers: def.maximumPlayers,
    })),
    screenshots: game.screenshots ?? [],
  };
}

export const gamesRouter = new Hono<Env>()
  .get('/', async (ctx) => {
    const metadata = Object.entries(games)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, game]) => gameSummary(game, ctx.env));
    // returns a list of all games and some metadata
    return ctx.json(
      metadata.reduce(
        (acc, game) => {
          acc[game.id] = game;
          return acc;
        },
        {} as Record<string, (typeof metadata)[number]>,
      ),
    );
  })

  // basically useful for correcting a lack of free games which should be
  // provided on signup
  .post('/applyFree', userStoreMiddleware, async (ctx) => {
    const session = ctx.get('session');
    const userId = session.userId;
    await ctx.env.ADMIN_STORE.applyFreeGames(userId);
    return ctx.json({ success: true });
  })
  .get('/owned', sessionMiddleware, async (ctx) => {
    const session = ctx.get('session');
    if (!session) {
      return ctx.json([]);
    }
    const gameIds = await ctx.env.PUBLIC_STORE.getStoreForUser(
      session.userId,
    ).getOwnedGames();
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
        includingGame: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const session = ctx.get('session');
      const { tags, includingGame } = ctx.req.valid('query');
      const products = await ctx.env.PUBLIC_STORE.getGameProducts(
        {
          tags,
          includingGame,
        },
        session?.isProductAdmin,
      );

      // mark purchases for logged in users
      let purchasedProductIds: PrefixedId<'gp'>[] = [];
      if (session) {
        const userStore = await ctx.env.PUBLIC_STORE.getStoreForUser(
          session.userId,
        );
        purchasedProductIds = await userStore.getOwnedGameProducts();
      }
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
  )
  .post(
    '/products/:productId/purchase',
    zValidator('param', z.object({ productId: idShapes.GameProduct })),
    zValidator('form', z.object({ returnTo: z.string().optional() })),
    userStoreMiddleware,
    async (ctx) => {
      const userId = ctx.get('session').userId;
      const { productId } = ctx.req.valid('param');
      const { returnTo } = ctx.req.valid('form');

      const user = await ctx.get('userStore').getMe();
      if (!user) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'User not found',
        );
      }

      // create an ad-hoc checkout session with the product's details
      const product = await ctx.env.PUBLIC_STORE.getGameProduct(productId);
      if (!product) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          `Game product not found: ${productId}`,
        );
      }

      // if game is free, just give it to the user
      if (product.priceCents === 0) {
        await ctx.env.ADMIN_STORE.purchaseGameProduct(userId, productId);
        return ctx.redirect(`${ctx.env.UI_ORIGIN}/library`);
      }

      const checkout = await getStripe(ctx.env).checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: product.priceCents,
              product_data: {
                name: product.name,
                description: product.description || undefined,
                metadata: createStripeGameProductCheckoutMetadata(product.id),
              },
            },
          },
        ],
        customer: user.stripeCustomerId ?? undefined,
        customer_creation: 'always',
        success_url: returnTo ?? `${ctx.env.UI_ORIGIN}/library`,
        cancel_url: `${returnTo ?? `${ctx.env.UI_ORIGIN}/library`}?productId=${product.id}cancelled=true`,
        customer_email: user.email,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: {
          userId,
          productId,
        },
      });

      if (!checkout.url) {
        throw new LongGameError(
          LongGameError.Code.InternalServerError,
          'Could not create checkout session',
        );
      }

      return ctx.redirect(checkout.url);
    },
  )
  .get(
    '/:id',
    zValidator('param', z.object({ id: z.string() })),
    async (ctx) => {
      const id = ctx.req.valid('param').id;
      const game = games[id];
      if (!game) {
        throw new LongGameError(
          LongGameError.Code.NotFound,
          `Game not found: ${id}`,
        );
      }
      return ctx.json(gameSummary(game, ctx.env));
    },
  );
