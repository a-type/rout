export interface AuthDB {
  insertUser(user: Omit<AuthUser, 'id'>): Promise<Pick<AuthUser, 'id'>>;
  insertAccount(
    account: Omit<AuthAccount, 'id'>,
  ): Promise<Pick<AuthAccount, 'id'>>;
  getUserByEmail(email: string): Promise<AuthUser | undefined>;
  getAccountByProviderAccountId(
    provider: string,
    providerAccountId: string,
  ): Promise<AuthAccount | undefined>;
}

export interface AuthUser {
  id: string;
  fullName: string | null;
  friendlyName: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
}

export interface AuthAccount {
  id: string;
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
