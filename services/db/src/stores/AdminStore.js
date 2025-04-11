import { comparePassword, hashPassword } from '@a-type/kysely';
import { assertPrefixedId, id } from '@long-game/common';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { createDb } from '../kysely/index.js';
export class AdminStore extends WorkerEntrypoint {
    #db;
    constructor(ctx, env) {
        super(ctx, env);
        this.#db = createDb({ DB: env.D1 });
    }
    async healthCheck() {
        const result = await this.env.D1.prepare('SELECT 1 AS alive;').first('alive');
        return result === 1;
    }
    async getAccountByProviderAccountId(providerName, providerAccountId) {
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
    async getUserByEmail(email) {
        return this.#db
            .selectFrom('User')
            .where('email', '=', email)
            .selectAll()
            .executeTakeFirst();
    }
    async insertAccount({ expiresAt, userId, ...account }) {
        return this.#db
            .insertInto('Account')
            .values({
            id: id('a'),
            accessTokenExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
            userId: userId,
            ...account,
        })
            .returning('id')
            .executeTakeFirstOrThrow();
    }
    async insertUser({ plaintextPassword, friendlyName: __, fullName: _, ...user }) {
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
    async insertVerificationCode({ expiresAt, ...verificationCode }) {
        await this.#db
            .insertInto('VerificationCode')
            .values({
            id: id('vc'),
            expiresAt: new Date(expiresAt),
            ...verificationCode,
        })
            .execute();
    }
    async getVerificationCode(email, code) {
        return this.#db
            .selectFrom('VerificationCode')
            .where('code', '=', code)
            .where('email', '=', email)
            .selectAll()
            .executeTakeFirst();
    }
    async consumeVerificationCode(id) {
        assertPrefixedId(id, 'vc');
        await this.#db
            .deleteFrom('VerificationCode')
            .where('id', '=', id)
            .execute();
    }
    async getUserByEmailAndPassword(email, plaintextPassword) {
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
    async updateUser(id, { plaintextPassword, ...user }) {
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
//# sourceMappingURL=AdminStore.js.map