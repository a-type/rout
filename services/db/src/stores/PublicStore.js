import { WorkerEntrypoint } from 'cloudflare:workers';
import { createDb } from '../kysely/index.js';
import { UserStore } from './UserStore.js';
export class PublicStore extends WorkerEntrypoint {
    #db;
    constructor(ctx, env) {
        super(ctx, env);
        this.#db = createDb({ DB: env.D1 });
    }
    async getStoreForUser(userId) {
        return new UserStore(userId, this.#db);
    }
    async getPublicFriendInvite(inviteId) {
        return this.#db
            .selectFrom('FriendshipInvitation')
            .innerJoin('User', 'FriendshipInvitation.inviterId', 'User.id')
            .where('id', '=', inviteId)
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
    async testRpc() {
        return {
            foo: 'bar',
        };
    }
}
//# sourceMappingURL=PublicStore.js.map