import { PrefixedId } from '@long-game/common';
import { AnyNotification } from '@long-game/notifications';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

// date serialization: Dates go in, strings come out.
type DateColumnRequired = ColumnType<string, Date, Date>;
type DateColumnOptional = ColumnType<
  string | null,
  Date | undefined,
  Date | null | undefined
> | null;
type DateColumnGenerated = ColumnType<
  string,
  Date | undefined,
  Date | null | undefined
>;

export type NotificationSettings = Record<
  AnyNotification['type'],
  { push: boolean; email: boolean }
>;

export interface Database {
  User: UserTable;
  Account: AccountTable;
  VerificationCode: VerificationCodeTable;
  GameSessionInvitation: GameSessionInvitationTable;
  GameSessionInvitationLink: GameSessionInvitationLinkTable;
  Friendship: FriendshipTable;
  FriendshipInvitation: FriendshipInvitationTable;
  PushSubscription: PushSubscriptionTable;
  Notification: NotificationTable;
  UserGamePurchase: UserGamePurchaseTable;
  GameProduct: GameProductTable;
  GameProductItem: GameProductItemTable;
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
  notificationSettings: ColumnType<
    NotificationSettings,
    NotificationSettings | null,
    NotificationSettings | null
  >;
  subscriptionEntitlements: Record<string, boolean>;
  isProductAdmin: boolean;
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
export type GameSessionInvitationUpdate =
  Updateable<GameSessionInvitationTable>;

export interface GameSessionInvitationLinkTable {
  id: PrefixedId<'gsl'>;
  createdAt: DateColumnGenerated;
  updatedAt: DateColumnGenerated;
  gameSessionId: PrefixedId<'gs'>;
  code: string;
}

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
export type FriendshipInvitation = Selectable<FriendshipInvitationTable>;
export type NewFriendshipInvitation = Insertable<FriendshipInvitationTable>;
export type FriendshipInvitationUpdate = Updateable<FriendshipInvitationTable>;

export interface PushSubscriptionTable {
  endpoint: string; // pk
  createdAt: DateColumnGenerated;
  updatedAt: DateColumnGenerated;
  userId: PrefixedId<'u'>;
  expirationTime: DateColumnOptional;
  p256dh: string | null;
  auth: string | null;
}
export type PushSubscription = Selectable<PushSubscriptionTable>;
export type NewPushSubscription = Insertable<PushSubscriptionTable>;
export type PushSubscriptionUpdate = Updateable<PushSubscriptionTable>;

export interface NotificationTable {
  id: PrefixedId<'no'>;
  createdAt: DateColumnGenerated;
  updatedAt: DateColumnGenerated;
  userId: PrefixedId<'u'>;
  data: AnyNotification;
  readAt: DateColumnOptional;
}
export type Notification = Selectable<NotificationTable>;
export type NewNotification = Insertable<NotificationTable>;
export type NotificationUpdate = Updateable<NotificationTable>;

export interface UserGamePurchaseTable {
  id: PrefixedId<'ugp'>;
  createdAt: DateColumnGenerated;
  updatedAt: DateColumnGenerated;
  userId: PrefixedId<'u'>;
  gameProductId: PrefixedId<'gp'>;
}
export type UserGamePurchase = Selectable<UserGamePurchaseTable>;
export type NewUserGamePurchase = Insertable<UserGamePurchaseTable>;
export type UserGamePurchaseUpdate = Updateable<UserGamePurchaseTable>;

export interface GameProductTable {
  id: PrefixedId<'gp'>;
  createdAt: DateColumnGenerated;
  updatedAt: DateColumnGenerated;
  priceCents: number;
  publishedAt: DateColumnOptional;
  name: string;
  description: string | null;
}
export type GameProduct = Selectable<GameProductTable>;
export type NewGameProduct = Insertable<GameProductTable>;
export type GameProductUpdate = Updateable<GameProductTable>;

export interface GameProductItemTable {
  id: PrefixedId<'gpi'>;
  createdAt: DateColumnGenerated;
  updatedAt: DateColumnGenerated;
  gameProductId: PrefixedId<'gp'>;
  gameId: string;
}
export type GameProductItem = Selectable<GameProductItemTable>;
export type NewGameProductItem = Insertable<GameProductItemTable>;
export type GameProductItemUpdate = Updateable<GameProductItemTable>;
