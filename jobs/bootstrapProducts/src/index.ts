import games from '@long-game/games';
import type { AdminStore } from '@long-game/service-db';

interface BootstrapBindings {
  ADMIN_STORE: Service<AdminStore>;
}

export default {
  fetch() {
    return new Response(null, {
      status: 302,
      headers: {
        Location: 'http://localhost:3113/cdn-cgi/handler/scheduled',
      },
    });
  },
  async scheduled(
    controller: ScheduledController,
    env: BootstrapBindings,
    ctx: ExecutionContext,
  ) {
    const gameIds = Object.keys(games);

    // find any existing products with only 1 item
    const existingProducts = await env.ADMIN_STORE.getSingleGameProducts();

    const gameIdsToCreate = new Set(gameIds);
    for (const product of existingProducts) {
      gameIdsToCreate.delete(product.gameId);
    }

    // create a new product for each gameId remaining
    for (const gameId of gameIdsToCreate) {
      const product = await env.ADMIN_STORE.createGameProduct({
        name: games[gameId].title,
        description: `Get ${games[gameId].title} a la carte`,
        priceCents: 0,
        publishedAt: null,
      });
      await env.ADMIN_STORE.addGameProductItem(product.id, gameId);

      console.log(`Created new game product for ${gameId}`);
    }
  },
};
