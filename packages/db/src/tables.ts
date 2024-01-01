import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  User: UserTable;
  Account: AccountTable;
  VerificationToken: VerificationTokenTable;
  GameSession: GameSessionTable;
  GameMove: GameMoveTable;
  GameSessionMembership: GameSessionMembershipTable;
}

export interface UserTable {
  id: string;
  createdAt: ColumnType<Date, Date | undefined, never>;
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;
  fullName: string | null;
  friendlyName: string | null;
  email: string;
  emailVerifiedAt: Date | null;
  imageUrl: string | null;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface AccountTable {
  id: string;
  createdAt: ColumnType<Date, Date | undefined, never>;
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;
  userId: string;
  type: 'email' | 'oidc' | 'oauth';
  provider: string;
  providerAccountId: string;
  refreshToken: string | undefined;
  accessToken: string | undefined;
  expiresAt: number | undefined;
  tokenType: string | undefined;
  scope: string | undefined;
  idToken: string | undefined;
}

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

export interface VerificationTokenTable {
  id: string;
  token: string;
  expiresAt: ColumnType<Date, Date | undefined, Date | undefined>;
}

export type VerificationToken = Selectable<VerificationTokenTable>;
export type NewVerificationToken = Insertable<VerificationTokenTable>;
export type VerificationTokenUpdate = Updateable<VerificationTokenTable>;

export interface GameSessionTable {
  id: string;
  createdAt: ColumnType<Date, Date | undefined, never>;
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;
  timezone: string;
  initialState: any;
  status: ColumnType<
    'pending' | 'active' | 'completed',
    'pending' | 'active' | 'completed' | undefined,
    'pending' | 'active' | 'completed'
  >;
  // does not relate to anything in the db; game information is
  // defined in code.
  gameId: string;
}

export type GameSession = Selectable<GameSessionTable>;
export type NewGameSession = Insertable<GameSessionTable>;
export type GameSessionUpdate = Updateable<GameSessionTable>;

export interface GameMoveTable {
  id: string;
  createdAt: ColumnType<Date, Date | undefined, never>;
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;

  gameSessionId: string;
  userId: string | null;
  // TODO: define this format? the main contents will be game dependent
  data: any;
}

export type GameMove = Selectable<GameMoveTable>;
export type NewGameMove = Insertable<GameMoveTable>;
export type GameMoveUpdate = Updateable<GameMoveTable>;

export interface GameSessionMembershipTable {
  id: string;
  createdAt: ColumnType<Date, Date | undefined, never>;
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;

  gameSessionId: string;
  inviterId: string;
  userId: string;
  expiresAt: ColumnType<Date, Date | undefined, Date | undefined>;
  claimedAt: ColumnType<Date, Date | undefined, Date | undefined>;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export type GameSessionMembership = Selectable<GameSessionMembershipTable>;
export type NewGameSessionMembership = Insertable<GameSessionMembershipTable>;
export type GameSessionMembershipUpdate =
  Updateable<GameSessionMembershipTable>;
