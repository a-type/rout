import { PlayerColorName, PrefixedId } from '@long-game/common';
import { RpcTarget } from 'cloudflare:workers';
import { DB } from '../kysely/index.js';
export declare class UserStore extends RpcTarget {
    #private;
    constructor(userId: PrefixedId<'u'>, db: DB);
    getSession(): Promise<{
        id: `u-${string}`;
        name: string;
    } | null>;
    getMe(): Promise<{
        id: `u-${string}`;
        email: string;
        imageUrl: string | null;
        displayName: string;
        color: string | null;
    } & {
        color: PlayerColorName;
        displayName: string;
        imageUrl: string | null;
    }>;
    /**
     * Gets user info. If the logged in user is friends with
     * this person, their full info will be returned. Otherwise,
     * anonymized info will be returned.
     */
    getUser(id: PrefixedId<'u'>): Promise<{
        id: `u-${string}`;
        imageUrl?: string | null | undefined;
        displayName?: string | undefined;
        color?: string | null | undefined;
    } & {
        color: PlayerColorName;
        displayName: string;
        imageUrl: string | null;
    }>;
    updateMe({ displayName, color, imageUrl, sendEmailUpdates, }: {
        displayName?: string;
        color?: string | null;
        imageUrl?: string | null;
        sendEmailUpdates?: boolean;
    }): Promise<{
        id: `u-${string}`;
        email: string;
        emailVerifiedAt: string | null;
        imageUrl: string | null;
        password: string | null;
        createdAt: string;
        updatedAt: string;
        displayName: string;
        color: string | null;
        stripeCustomerId: string | null;
        acceptedTosAt: string | null;
        sendEmailUpdates: boolean;
    }[]>;
    acceptTos(): Promise<void>;
    /**
     * Confirmed friendships
     */
    getFriendships(): Promise<{
        id: `u-${string}`;
        imageUrl: string | null;
        displayName: string;
        color: string | null;
    }[]>;
    /**
     * Incoming invites for this user
     */
    getFriendshipInvites({ direction, }: {
        direction: 'incoming' | 'outgoing';
    }): Promise<{
        status: "pending" | "accepted" | "declined" | "blocked";
        id: `fi-${string}`;
        email: string;
        otherUser: {
            id: `u-${string}`;
            imageUrl: string | null;
            displayName: string;
            color: string | null;
        } | null;
    }[]>;
    insertFriendshipInvite(invitedEmail: string): Promise<{
        id: `fi-${string}`;
    }>;
    respondToFriendshipInvite(friendshipId: PrefixedId<'fi'>, status: 'accepted' | 'declined' | 'retracted'): Promise<{
        status: "pending" | "accepted" | "declined" | "blocked";
        expiresAt: string;
        id: `fi-${string}`;
        email: string;
        createdAt: string;
        updatedAt: string;
        inviterId: `u-${string}`;
    }[] | undefined>;
    insertFoundingGameMembership(gameSessionId: PrefixedId<'gs'>): Promise<{
        status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
        userId: `u-${string}`;
        gameSessionId: `gs-${string}`;
        expiresAt: string;
        id: `gsi-${string}`;
        createdAt: string;
        updatedAt: string;
        inviterId: `u-${string}`;
        claimedAt: string | null;
        role: "player" | "spectator";
    }>;
    getGameSessions(filter?: {
        status?: 'pending' | 'accepted' | 'declined' | 'expired';
        first?: number;
        after?: string;
    }): Promise<{
        results: {
            status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
            gameSessionId: `gs-${string}`;
            createdAt: string;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
        };
    }>;
    /**
     * Returns only the accepted members of a session
     */
    getGameSessionMembers(gameSessionId: PrefixedId<'gs'>): Promise<{
        color: PlayerColorName;
        id: `u-${string}`;
        imageUrl: string | null;
        displayName: string;
    }[]>;
    getGameSessionInvitations(status: 'pending' | 'accepted' | 'declined'): Promise<{
        status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
        userId: `u-${string}`;
        gameSessionId: `gs-${string}`;
        expiresAt: string;
        id: `gsi-${string}`;
        createdAt: string;
        updatedAt: string;
        inviterId: `u-${string}`;
        claimedAt: string | null;
        role: "player" | "spectator";
    }[]>;
    getGameSessionInvitationForSpecificSession(sessionId: PrefixedId<'gs'>): Promise<{
        status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
        userId: `u-${string}`;
        gameSessionId: `gs-${string}`;
        expiresAt: string;
        id: `gsi-${string}`;
        createdAt: string;
        updatedAt: string;
        inviterId: `u-${string}`;
        claimedAt: string | null;
        role: "player" | "spectator";
    } | undefined>;
    sendGameSessionInvitation(gameSessionId: PrefixedId<'gs'>, userId: PrefixedId<'u'>): Promise<{
        status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
        userId: `u-${string}`;
        gameSessionId: `gs-${string}`;
        expiresAt: string;
        id: `gsi-${string}`;
        createdAt: string;
        updatedAt: string;
        inviterId: `u-${string}`;
        claimedAt: string | null;
        role: "player" | "spectator";
    }>;
    respondToGameSessionInvitation(inviteId: PrefixedId<'gsi'>, response: 'accepted' | 'declined'): Promise<{
        status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
        userId: `u-${string}`;
        gameSessionId: `gs-${string}`;
        expiresAt: string;
        id: `gsi-${string}`;
        createdAt: string;
        updatedAt: string;
        inviterId: `u-${string}`;
        claimedAt: string | null;
        role: "player" | "spectator";
    }>;
    /**
     * Unfortunately ambiguously named with `getGameSessionInvitations`,
     * but this one lists invitations to a specific game session
     * the user has access to.
     */
    getInvitationsToGameSession(gameSessionId: PrefixedId<'gs'>): Promise<{
        status: "pending" | "accepted" | "declined" | "expired" | "uninvited";
        expiresAt: string;
        id: `gsi-${string}`;
        inviterId: `u-${string}`;
        user: {
            id: `u-${string}`;
            email: string;
            imageUrl: string | null;
            displayName: string;
            color: string | null;
        } | null;
    }[]>;
}
//# sourceMappingURL=UserStore.d.ts.map