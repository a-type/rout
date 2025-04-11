import { PrefixedId } from '@long-game/common';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { UserStore } from './UserStore.js';
export declare class PublicStore extends WorkerEntrypoint<DbBindings> {
    #private;
    constructor(ctx: ExecutionContext, env: DbBindings);
    getStoreForUser(userId: PrefixedId<'u'>): Promise<UserStore>;
    getPublicFriendInvite(inviteId: PrefixedId<'fi'>): Promise<{
        status: "pending" | "accepted" | "declined" | "blocked";
        expiresAt: string;
        id: `fi-${string}`;
        email: string;
        inviterDisplayName: string;
        inviterId: `u-${string}`;
    } | undefined>;
    testRpc(): Promise<{
        foo: string;
    }>;
}
//# sourceMappingURL=PublicStore.d.ts.map