import { AuthAccount, AuthUser, AuthVerificationCode } from '@a-type/auth';
import { PrefixedId, assertPrefixedId, id } from '@long-game/common';
import {
  DB,
  GameProductUpdate,
  NewGameProduct,
  NotificationSettings,
  comparePassword,
  createDb,
  hashPassword,
} from '@long-game/kysely';
import { AnyNotification } from '@long-game/notifications';
import { WorkerEntrypoint } from 'cloudflare:workers';

export class AdminStore extends WorkerEntrypoint<DbBindings> {
  #db: DB;

  constructor(ctx: ExecutionContext, env: DbBindings) {
    super(ctx, env);
    this.#db = createDb({ DB: env.D1 });
  }

  async healthCheck() {
    const result = await this.env.D1.prepare(
      'SELECT 1 AS alive;',
    ).first<number>('alive');
    return result === 1;
  }

  async getAccountByProviderAccountId(
    providerName: string,
    providerAccountId: string,
  ) {
    const dbAccount = await this.#db
      .selectFrom('Account')
      .where('provider', '=', providerName)
      .where('providerAccountId', '=', providerAccountId)
      .selectAll()
      .executeTakeFirst();

    if (!dbAccount) {
      return undefined;
    }

    return {
      ...dbAccount,
      expiresAt: dbAccount.accessTokenExpiresAt ?? null,
    };
  }

  async getUser(id: PrefixedId<'u'>) {
    assertPrefixedId(id, 'u');
    return this.#db
      .selectFrom('User')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  }

  async getUserByEmail(email: string) {
    return this.#db
      .selectFrom('User')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }

  async getUserByCustomerId(stripeCustomerId: string) {
    return this.#db
      .selectFrom('User')
      .where('stripeCustomerId', '=', stripeCustomerId)
      .selectAll()
      .executeTakeFirst();
  }

  async insertAccount({
    expiresAt,
    userId,
    ...account
  }: Omit<AuthAccount, 'id'>) {
    return this.#db
      .insertInto('Account')
      .values({
        id: id('a'),
        accessTokenExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
        userId: userId as PrefixedId<'u'>,
        ...account,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
  }

  async insertUser({
    plaintextPassword,
    friendlyName: __,
    fullName: _,
    ...user
  }: Omit<AuthUser, 'id' | 'password'> & {
    plaintextPassword?: string | null;
  }) {
    const password = plaintextPassword
      ? await hashPassword(plaintextPassword)
      : undefined;
    const userResult = await this.#db
      .insertInto('User')
      .values({
        id: id('u'),
        password,
        displayName: '',
        subscriptionEntitlements: {},
        isProductAdmin: false,
        ...user,
      })
      .returning('id')
      .executeTakeFirst();

    if (!userResult) {
      throw new Error('Failed to insert user');
    }

    // also insert free game purchases and add notifications for them
    await this.applyFreeGames(userResult.id as PrefixedId<'u'>);

    return userResult;
  }

  async applyFreeGames(userId: PrefixedId<'u'>) {
    // find all free game products
    const freeGameProducts = await this.#db
      .selectFrom('GameProduct')
      .where('priceCents', '=', 0)
      .where('publishedAt', 'is not', null)
      .select('GameProduct.id')
      .execute();
    for (const product of freeGameProducts) {
      await this.purchaseGameProduct(userId, product.id);
    }
  }

  async purchaseGameProduct(
    userId: PrefixedId<'u'>,
    gameProductId: PrefixedId<'gp'>,
  ) {
    await this.#db
      .insertInto('UserGamePurchase')
      .values({
        id: id('ugp'),
        userId: userId,
        gameProductId,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();

    const gameItems = await this.#db
      .selectFrom('GameProductItem')
      .where('gameProductId', '=', gameProductId)
      .select('gameId')
      .execute();

    const deduplicatedGameItems = Array.from(
      new Set(gameItems.map((item) => item.gameId)),
    );

    for (const gameId of deduplicatedGameItems) {
      await this.insertNotification(userId, {
        type: 'new-game',
        gameId,
        id: id('no'),
      });
    }
  }

  async insertVerificationCode({
    expiresAt,
    ...verificationCode
  }: Omit<AuthVerificationCode, 'id'>) {
    await this.#db
      .insertInto('VerificationCode')
      .values({
        id: id('vc'),
        expiresAt: new Date(expiresAt),
        ...verificationCode,
      })
      .execute();
  }

  async getVerificationCode(email: string, code: string) {
    return this.#db
      .selectFrom('VerificationCode')
      .where('code', '=', code)
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }

  async consumeVerificationCode(id: string) {
    assertPrefixedId(id, 'vc');
    await this.#db
      .deleteFrom('VerificationCode')
      .where('id', '=', id)
      .execute();
  }

  async getUserByEmailAndPassword(email: string, plaintextPassword: string) {
    const user = await this.#db
      .selectFrom('User')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();

    if (!user?.password) {
      return undefined;
    }

    if (!(await comparePassword(plaintextPassword, user.password))) {
      return undefined;
    }

    return user;
  }

  async updateUser(
    id: string,
    {
      plaintextPassword,
      ...user
    }: Partial<Omit<AuthUser, 'id' | 'password' | 'email'>> & {
      plaintextPassword?: string | null;
    },
  ) {
    assertPrefixedId(id, 'u');
    const password = plaintextPassword
      ? await hashPassword(plaintextPassword)
      : undefined;
    await this.#db
      .updateTable('User')
      .set({
        password,
        ...user,
      })
      .where('id', '=', id)
      .execute();
  }

  async assignUserCustomerId(userId: PrefixedId<'u'>, customerId: string) {
    assertPrefixedId(userId, 'u');
    await this.#db
      .updateTable('User')
      .set({
        stripeCustomerId: customerId,
      })
      .where('id', '=', userId)
      .execute();
  }

  async getUserNotificationSettings(id: PrefixedId<'u'>) {
    const user = await this.#db
      .selectFrom('User')
      .where('id', '=', id)
      .select('notificationSettings')
      .executeTakeFirst();

    return deepMerge<NotificationSettings>(user?.notificationSettings ?? {}, {
      'turn-ready': {
        push: false,
        email: false,
      },
      'friend-invite': {
        push: false,
        email: false,
      },
      'game-invite': {
        push: false,
        email: false,
      },
    });
  }

  async insertNotification(
    userId: PrefixedId<'u'>,
    notification: AnyNotification,
  ) {
    await this.#db
      .insertInto('Notification')
      .values({
        id: notification.id,
        userId,
        data: notification,
      })
      .execute();
  }

  async markNotificationAsRead(notificationId: PrefixedId<'no'>) {
    assertPrefixedId(notificationId, 'no');

    await this.#db
      .updateTable('Notification')
      .set({
        readAt: new Date(),
      })
      .where('id', '=', notificationId)
      .execute();
  }

  async updateUserEntitlements(
    userId: PrefixedId<'u'>,
    entitlements: Record<string, boolean>,
  ) {
    assertPrefixedId(userId, 'u');
    await this.#db
      .updateTable('User')
      .set({
        subscriptionEntitlements: entitlements,
      })
      .where('id', '=', userId)
      .execute();
  }

  async createGameProduct(init?: Partial<NewGameProduct>) {
    const gameProduct = await this.#db
      .insertInto('GameProduct')
      .values({
        id: id('gp'),
        name: 'New Product',
        priceCents: 0,
        description: '',
        publishedAt: null,
        ...init,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return gameProduct;
  }

  async updateGameProduct(
    gameProductId: PrefixedId<'gp'>,
    updates: GameProductUpdate,
  ) {
    const updated = await this.#db
      .updateTable('GameProduct')
      .set(updates)
      .where('id', '=', gameProductId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return updated;
  }

  async addGameProductItem(gameProductId: PrefixedId<'gp'>, gameId: string) {
    const gameProductItem = await this.#db
      .insertInto('GameProductItem')
      .values({
        id: id('gpi'),
        gameProductId,
        gameId,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return gameProductItem;
  }

  async removeGameProductItem(gameProductItemId: PrefixedId<'gpi'>) {
    assertPrefixedId(gameProductItemId, 'gpi');
    await this.#db
      .deleteFrom('GameProductItem')
      .where('id', '=', gameProductItemId)
      .execute();
  }

  async unpublishGameProduct(gameProductId: PrefixedId<'gp'>) {
    assertPrefixedId(gameProductId, 'gp');
    await this.#db
      .updateTable('GameProduct')
      .set({
        publishedAt: null,
      })
      .where('id', '=', gameProductId)
      .execute();
  }

  async deleteGameProduct(gameProductId: PrefixedId<'gp'>) {
    assertPrefixedId(gameProductId, 'gp');
    await this.#db
      .deleteFrom('GameProduct')
      .where('id', '=', gameProductId)
      .execute();
  }

  async isGameProductOwnedByUsers(
    gameProductId: PrefixedId<'gp'>,
  ): Promise<boolean> {
    assertPrefixedId(gameProductId, 'gp');
    const count = await this.#db
      .selectFrom('UserGamePurchase')
      .where('gameProductId', '=', gameProductId)
      .select('UserGamePurchase.id')
      .limit(1)
      .executeTakeFirst();

    return !!count;
  }

  /**
   * Selects game products which only have 1 game
   */
  async getSingleGameProducts() {
    return this.#db
      .selectFrom('GameProduct')
      .innerJoin(
        'GameProductItem',
        'GameProduct.id',
        'GameProductItem.gameProductId',
      )
      .select(['GameProduct.id', 'GameProductItem.gameId'])
      .groupBy('GameProduct.id')
      .having((eb) => eb.fn.count('GameProductItem.id'), '=', 1)
      .execute();
  }
}

function deepMerge<T>(target: any, source: any): T {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
