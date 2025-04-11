import { PrefixedId } from '@long-game/common';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
type DateColumnRequired = ColumnType<string, Date, Date>;
type DateColumnOptional = ColumnType<string | null, Date | undefined, Date | null | undefined> | null;
type DateColumnGenerated = ColumnType<string, Date | undefined, Date | null | undefined>;
export interface Database {
    User: UserTable;
    Account: AccountTable;
    VerificationCode: VerificationCodeTable;
    GameSessionInvitation: GameSessionInvitationTable;
    Friendship: FriendshipTable;
    FriendshipInvitation: FriendshipInvitationTable;
}
export interface UserTable {
    id: PrefixedId<'u'>;
    createdAt: DateColumnGenerated;
    updatedAt: DateColumnGenerated;
    displayName: string;
    email: string;
    emailVerifiedAt: DateColumnOptional;
    imageUrl: string | null;
    color: string | null;
    password: string | null;
    stripeCustomerId: string | null;
    acceptedTosAt: DateColumnOptional;
    sendEmailUpdates: ColumnType<boolean, boolean | undefined, boolean>;
}
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
export interface AccountTable {
    id: PrefixedId<'a'>;
    createdAt: DateColumnGenerated;
    updatedAt: DateColumnGenerated;
    type: string;
    provider: string;
    providerAccountId: string;
    refreshToken: string | null;
    accessToken: string | null;
    tokenType: string | null;
    accessTokenExpiresAt: DateColumnOptional;
    scope: string | null;
    idToken: string | null;
    userId: PrefixedId<'u'>;
}
export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;
export interface VerificationCodeTable {
    id: PrefixedId<'vc'>;
    createdAt: DateColumnGenerated;
    updatedAt: DateColumnOptional;
    code: string;
    email: string;
    name: string;
    expiresAt: DateColumnRequired;
}
export type VerificationCode = Selectable<VerificationCodeTable>;
export type NewVerificationCode = Insertable<VerificationCodeTable>;
export type VerificationCodeUpdate = Updateable<VerificationCodeTable>;
export interface GameSessionInvitationTable {
    id: PrefixedId<'gsi'>;
    createdAt: DateColumnGenerated;
    updatedAt: DateColumnGenerated;
    gameSessionId: PrefixedId<'gs'>;
    inviterId: PrefixedId<'u'>;
    userId: PrefixedId<'u'>;
    expiresAt: DateColumnRequired;
    claimedAt: DateColumnOptional;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'uninvited';
    role: 'player' | 'spectator';
}
export type GameSessionInvitation = Selectable<GameSessionInvitationTable>;
export type NewGameSessionInvitation = Insertable<GameSessionInvitationTable>;
export type GameSessionInvitationUpdate = Updateable<GameSessionInvitationTable>;
export interface FriendshipTable {
    id: PrefixedId<'f'>;
    createdAt: DateColumnGenerated;
    updatedAt: DateColumnGenerated;
    userId: PrefixedId<'u'>;
    friendId: PrefixedId<'u'>;
    initiatorId: PrefixedId<'u'>;
}
export type Friendship = Selectable<FriendshipTable>;
export type NewFriendship = Insertable<FriendshipTable>;
export type FriendshipUpdate = Updateable<FriendshipTable>;
export interface FriendshipInvitationTable {
    id: PrefixedId<'fi'>;
    createdAt: DateColumnGenerated;
    updatedAt: DateColumnGenerated;
    inviterId: PrefixedId<'u'>;
    email: string;
    expiresAt: DateColumnRequired;
    status: 'pending' | 'accepted' | 'declined' | 'blocked';
}
export {};
//# sourceMappingURL=tables.d.ts.map