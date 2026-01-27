import { PrefixedId } from '@long-game/common';
import games from '@long-game/games';
import { DB, createDb, dateTime, jsonArrayFrom } from '@long-game/kysely';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { UserStore } from './UserStore.js';

export interface GameProductsFilter {
  tags?: string[];
  includingGame?: string;
}

export class PublicStore extends WorkerEntrypoint<ApiBindings> {
  #db: DB;

  constructor(ctx: ExecutionContext, env: ApiBindings) {
    super(ctx, env);
    this.#db = createDb({ DB: env.D1 });
  }

  async getStoreForUser(userId: PrefixedId<'u'>) {
    return new UserStore(userId, this.#db, this.env);
  }

  async getPublicFriendInvite(inviteId: PrefixedId<'fi'>) {
    return this.#db
      .selectFrom('FriendshipInvitation')
      .innerJoin('User', 'FriendshipInvitation.inviterId', 'User.id')
      .where('FriendshipInvitation.id', '=', inviteId)
      .select([
        'FriendshipInvitation.id',
        'FriendshipInvitation.status',
        'FriendshipInvitation.email',
        'FriendshipInvitation.expiresAt',
        'User.displayName as inviterDisplayName',
        'User.id as inviterId',
      ])
      .executeTakeFirst();
  }

  async getGameSessionIdFromInvitationCode(code: string) {
    const result = await this.#db
      .selectFrom('GameSessionInvitationLink')
      .where('GameSessionInvitationLink.code', '=', code)
      .select(['GameSessionInvitationLink.gameSessionId'])
      .executeTakeFirst();
    return result?.gameSessionId;
  }

  async getGameProducts(
    filter: GameProductsFilter,
    includeUnpublished = false,
  ) {
    let query = this.#db
      .selectFrom('GameProduct')
      .select([
        'GameProduct.id',
        'GameProduct.name',
        'GameProduct.priceCents',
        'GameProduct.publishedAt',
        'GameProduct.description',
      ])
      .select((sb) => [
        jsonArrayFrom(
          sb
            .selectFrom('GameProductItem')
            .select(['GameProductItem.id', 'GameProductItem.gameId'])
            .whereRef('GameProductItem.gameProductId', '=', 'GameProduct.id'),
        ).as('gameProductItems'),
      ]);

    if (filter?.includingGame) {
      query = query
        .innerJoin(
          'GameProductItem',
          'GameProductItem.gameProductId',
          'GameProduct.id',
        )
        .where('GameProductItem.gameId', '=', filter.includingGame);
    }
    if (!includeUnpublished) {
      query = query
        .where('GameProduct.publishedAt', 'is not', 'null')
        .where('GameProduct.publishedAt', '<=', dateTime(new Date()));
    }

    console.log(query.compile().sql);

    const results = await query.execute();
    const filteredProducts = filter
      ? results.filter((product) => {
          if (!filter.tags) {
            return true;
          }
          const productTags = product.gameProductItems
            .map((item) => item.gameId)
            .map((gameId) => games[gameId]?.tags ?? [])
            .flat();
          return filter.tags.every((tag) => productTags.includes(tag));
        })
      : results;
    return filteredProducts;
  }

  async getGameProduct(productId: PrefixedId<'gp'>) {
    const product = await this.#db
      .selectFrom('GameProduct')
      .select((sb) => [
        jsonArrayFrom(
          sb
            .selectFrom('GameProductItem')
            .select(['GameProductItem.id', 'GameProductItem.gameId'])
            .whereRef('GameProductItem.gameProductId', '=', 'GameProduct.id'),
        ).as('gameProductItems'),
      ])
      .where('GameProduct.id', '=', productId)
      .selectAll('GameProduct')
      .executeTakeFirst();
    return product;
  }
}
