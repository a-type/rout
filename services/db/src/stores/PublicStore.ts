import { PrefixedId } from '@long-game/common';
import games from '@long-game/games';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { DB, createDb, jsonArrayFrom } from '../kysely/index.js';
import { UserStore } from './UserStore.js';

export interface GameProductsFilter {
  tags?: string[];
}

export class PublicStore extends WorkerEntrypoint<DbBindings> {
  #db: DB;

  constructor(ctx: ExecutionContext, env: DbBindings) {
    super(ctx, env);
    this.#db = createDb({ DB: env.D1 });
  }

  async getStoreForUser(userId: PrefixedId<'u'>) {
    return new UserStore(userId, this.#db);
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

  async getGameProducts(filter: GameProductsFilter) {
    const query = await this.#db
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
      ])
      .execute();

    const filteredProducts = filter
      ? query.filter((product) => {
          if (!filter.tags) {
            return true;
          }
          const productTags = product.gameProductItems
            .map((item) => item.gameId)
            .map((gameId) => games[gameId]?.tags ?? [])
            .flat();
          return filter.tags.every((tag) => productTags.includes(tag));
        })
      : query;
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
