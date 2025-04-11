import { AuthAccount, AuthUser, AuthVerificationCode } from '@a-type/auth';
import { WorkerEntrypoint } from 'cloudflare:workers';
export declare class AdminStore extends WorkerEntrypoint<DbBindings> {
    #private;
    constructor(ctx: ExecutionContext, env: DbBindings);
    healthCheck(): Promise<boolean>;
    getAccountByProviderAccountId(providerName: string, providerAccountId: string): Promise<{
        expiresAt: string | null;
        userId: `u-${string}`;
        id: `a-${string}`;
        type: string;
        provider: string;
        providerAccountId: string;
        refreshToken: string | null;
        accessToken: string | null;
        tokenType: string | null;
        scope: string | null;
        idToken: string | null;
        createdAt: string;
        updatedAt: string;
        accessTokenExpiresAt: string | null;
    } | undefined>;
    getUserByEmail(email: string): Promise<{
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
    } | undefined>;
    insertAccount({ expiresAt, userId, ...account }: Omit<AuthAccount, 'id'>): Promise<{
        id: `a-${string}`;
    }>;
    insertUser({ plaintextPassword, friendlyName: __, fullName: _, ...user }: Omit<AuthUser, 'id' | 'password'> & {
        plaintextPassword?: string | null;
    }): Promise<{
        id: `u-${string}`;
    }>;
    insertVerificationCode({ expiresAt, ...verificationCode }: Omit<AuthVerificationCode, 'id'>): Promise<void>;
    getVerificationCode(email: string, code: string): Promise<{
        name: string;
        expiresAt: string;
        id: `vc-${string}`;
        email: string;
        code: string;
        createdAt: string;
        updatedAt: string | null;
    } | undefined>;
    consumeVerificationCode(id: string): Promise<void>;
    getUserByEmailAndPassword(email: string, plaintextPassword: string): Promise<{
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
    } | undefined>;
    updateUser(id: string, { plaintextPassword, ...user }: Partial<Omit<AuthUser, 'id' | 'password' | 'email'>> & {
        plaintextPassword?: string | null;
    }): Promise<void>;
}
//# sourceMappingURL=AdminStore.d.ts.map