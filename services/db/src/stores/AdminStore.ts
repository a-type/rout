import { AuthAccount, AuthUser, AuthVerificationCode } from '@a-type/auth';
import { comparePassword, hashPassword } from '@a-type/kysely';
import { PrefixedId, assertPrefixedId, id } from '@long-game/common';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { DB, createDb } from '../kysely/index.js';

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

  async getUserByEmail(email: string) {
    return this.#db
      .selectFrom('User')
      .where('email', '=', email)
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
        ...user,
      })
      .returning('id')
      .executeTakeFirst();

    if (!userResult) {
      throw new Error('Failed to insert user');
    }

    return userResult;
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
}
