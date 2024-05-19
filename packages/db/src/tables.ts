import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

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
  FriendshipView: FriendshipTable;
  ChatMessage: ChatMessageTable;
}

export interface UserTable {
  id: string;
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
  id: string;
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
  userId: string;
}

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

export interface VerificationCodeTable {
  id: string;
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
  id: string;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;
  timezone: string;
  initialState: any;
  startedAt: ColumnType<string, string | undefined, string | undefined>;
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
  gameSessionId: string;
  userId: string;
  roundIndex: number;
  // the main contents will be game dependent, see game-definition
  data: any;
}

export type GameTurn = Selectable<GameTurnTable>;
export type NewGameTurn = Insertable<GameTurnTable>;
export type GameTurnUpdate = Updateable<GameTurnTable>;

export interface GameSessionMembershipTable {
  id: string;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  gameSessionId: string;
  inviterId: string;
  userId: string;
  expiresAt: ColumnType<string, string | undefined, string | undefined>;
  claimedAt: ColumnType<string, string | undefined, string | undefined>;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export type GameSessionMembership = Selectable<GameSessionMembershipTable>;
export type NewGameSessionMembership = Insertable<GameSessionMembershipTable>;
export type GameSessionMembershipUpdate =
  Updateable<GameSessionMembershipTable>;

export interface FriendshipTable {
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'declined';

  // FYI to future me - this is queried as a view.
  // if you change this, you'll need to update the view.
}

export type Friendship = Selectable<FriendshipTable>;
export type NewFriendship = Insertable<FriendshipTable>;
export type FriendshipUpdate = Updateable<FriendshipTable>;

export interface ChatMessageTable {
  id: string;
  createdAt: CreatedAtColumn;
  updatedAt: UpdatedAtColumn;

  userId: string;
  gameSessionId: string;
  message: string;
}

export type ChatMessage = Selectable<ChatMessageTable>;
export type NewChatMessage = Insertable<ChatMessageTable>;
export type ChatMessageUpdate = Updateable<ChatMessageTable>;
