import { AuthDB } from './db.js';
import { AuthProvider } from './providers/types.js';
import { RETURN_TO_COOKIE } from './returnTo.js';
import { getOrCreateSession } from './session.js';

export function createHandlers({
  providers,
  db,
  defaultReturnTo = '/',
}: {
  providers: Record<string, AuthProvider>;
  db: AuthDB;
  defaultReturnTo?: string;
}) {
  function handleOAuthLoginRequest(req: Request, opts: { provider: string }) {
    const url = new URL(req.url);
    const providerName = opts.provider;
    if (!(providerName in providers)) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    const provider = providers[providerName as keyof typeof providers];
    const loginUrl = provider.getLoginUrl();

    return new Response(null, {
      status: 302,
      headers: {
        location: loginUrl,
        'set-cookie': `${RETURN_TO_COOKIE}=${
          url.searchParams.get('returnTo') ?? defaultReturnTo
        }; Path=/`,
      },
    });
  }

  async function handleOAuthCallbackRequest(
    req: Request,
    opts: { provider: string },
  ) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    if (!code) {
      throw new Error('Missing code');
    }

    const providerName = opts.provider;
    if (!(providerName in providers)) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    const provider = providers[providerName as keyof typeof providers];

    const tokens = await provider.getTokens(code);
    const profile = await provider.getProfile(tokens.accessToken);

    const account = await db.getAccountByProviderAccountId(
      providerName,
      profile.id,
    );

    let userId: string;
    if (account) {
      userId = account.userId;
    } else {
      const user = await db.getUserByEmail(profile.email);
      if (user) {
        userId = user.id;
      } else {
        const user = await db.insertUser({
          fullName: profile.fullName,
          friendlyName: profile.friendlyName ?? null,
          email: profile.email,
          emailVerifiedAt: null,
          imageUrl: profile.avatarUrl ?? null,
        });
        userId = user.id;
      }
      await db.insertAccount({
        userId,
        type: 'oauth',
        provider: providerName,
        providerAccountId: profile.id,
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
        idToken: tokens.idToken,
      });
    }

    const res = new Response(null, {
      status: 302,
      headers: {
        location: url.searchParams.get('returnTo') ?? defaultReturnTo,
      },
    });
    const session = await getOrCreateSession(req, res);
    session.userId = userId;
    await session.save();
    return res;
  }

  async function handleLogoutRequest(req: Request) {
    const url = new URL(req.url);
    const returnTo = url.searchParams.get('returnTo') ?? defaultReturnTo;
    const res = new Response(null, {
      status: 302,
      headers: {
        location: returnTo,
      },
    });
    const session = await getOrCreateSession(req, res);
    session.destroy();
    return res;
  }

  return {
    handleOAuthLoginRequest,
    handleOAuthCallbackRequest,
    handleLogoutRequest,
  };
}
