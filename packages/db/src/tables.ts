import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';
import { PrefixedId } from './utils.js';

type CreatedAtColumn = ColumnType<string, string | undefined, never>;
type UpdatedAtColumn = ColumnType<
  string,
  string | undefined,
  string | undefined
>;

export interface Database {
  User: UserTable;
  Account: AccountTable;
  VerificationCode: VerificationCodeTable;
  GameSession: GameSessionTable;
  GameTurn: GameTurnTable;
  GameSessionMembership: GameSessionMembershipTable;
  Friendship: FriendshipTable;
  ChatMessage: ChatMessageTable;
}

export interface UserTable {
  id: PrefixedId<'u'>;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;
  fullName: string | null;
  friendlyName: string | null;
  email: string;
  emailVerifiedAt: string | null;
  imageUrl: string | null;
  color: string | null;
  password: string | null;
  stripeCustomerId: string | null;
  acceptedTosAt: ColumnType<Date, Date | undefined, Date | undefined> | null;
  sendEmailUpdates: ColumnType<boolean, boolean | undefined, boolean>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface AccountTable {
  id: PrefixedId<'a'>;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken: string | null;
  accessToken: string | null;
  tokenType: string | null;
  accessTokenExpiresAt: ColumnType<Date, Date | undefined, Date> | null;
  scope: string | null;
  idToken: string | null;
  userId: PrefixedId<'u'>;
}

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

export interface VerificationCodeTable {
  id: PrefixedId<'vc'>;
  createdAt: ColumnType<Date, Date | undefined, never>;
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;

  code: string;
  email: string;
  name: string;
  expiresAt: ColumnType<Date, Date | undefined, Date | undefined>;
}

export type VerificationCode = Selectable<VerificationCodeTable>;
export type NewVerificationCode = Insertable<VerificationCodeTable>;
export type VerificationCodeUpdate = Updateable<VerificationCodeTable>;

export interface GameSessionTable {
  id: PrefixedId<'gs'>;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;
  timezone: string;
  startedAt: ColumnType<string | null, string | undefined, string | undefined>;
  randomSeed: ColumnType<string, string | undefined, string | undefined>;
  // does not relate to anything in the db; game information is
  // defined in code.
  gameId: string;
  gameVersion: string;
}

export type GameSession = Selectable<GameSessionTable>;
export type NewGameSession = Insertable<GameSessionTable>;
export type GameSessionUpdate = Updateable<GameSessionTable>;

export interface GameTurnTable {
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  // primary key is composite of these 3 columns
  gameSessionId: PrefixedId<'gs'>;
  userId: PrefixedId<'u'>;
  roundIndex: number;
  // the main contents will be game dependent, see game-definition
  data: any;
}

export type GameTurn = Selectable<GameTurnTable>;
export type NewGameTurn = Insertable<GameTurnTable>;
export type GameTurnUpdate = Updateable<GameTurnTable>;

export interface GameSessionMembershipTable {
  id: PrefixedId<'gsm'>;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  gameSessionId: PrefixedId<'gs'>;
  inviterId: PrefixedId<'u'>;
  userId: PrefixedId<'u'>;
  expiresAt: ColumnType<string, string | undefined, string | undefined>;
  claimedAt: ColumnType<string, string | undefined, string | undefined>;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'uninvited';
}

export type GameSessionMembership = Selectable<GameSessionMembershipTable>;
export type NewGameSessionMembership = Insertable<GameSessionMembershipTable>;
export type GameSessionMembershipUpdate =
  Updateable<GameSessionMembershipTable>;

export interface FriendshipTable {
  id: PrefixedId<'f'>;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  userId: PrefixedId<'u'>;
  friendId: PrefixedId<'u'>;
  initiatorId: PrefixedId<'u'>;
  status: 'pending' | 'accepted' | 'declined';
}

export type Friendship = Selectable<FriendshipTable>;
export type NewFriendship = Insertable<FriendshipTable>;
export type FriendshipUpdate = Updateable<FriendshipTable>;

export interface ChatMessageTable {
  id: PrefixedId<'cm'>;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  userId: PrefixedId<'u'>;
  gameSessionId: PrefixedId<'gs'>;
  message: string;
  // chats can optionally be placed on the game board somewhere
  position: { x: number; y: number } | null;
  // chats can be associated with a round
  roundIndex: number | null;
  // chats can optionally be associated with a scene in the game.
  // this does not relate to any tables in the database, it is
  // interpreted per-game
  sceneId: string | null;
}

export type ChatMessage = Selectable<ChatMessageTable>;
export type NewChatMessage = Insertable<ChatMessageTable>;
export type ChatMessageUpdate = Updateable<ChatMessageTable>;
