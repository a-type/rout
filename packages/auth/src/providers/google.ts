import { AuthProvider, Profile, Tokens } from './types.js';
import { google, Auth } from 'googleapis';

export class GoogleProvider implements AuthProvider {
  private googleOAuth;

  constructor({
    clientId,
    clientSecret,
    redirectUri,
  }: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) {
    this.googleOAuth = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  getLoginUrl(): string {
    return this.googleOAuth.generateAuthUrl({
      access_type: 'online',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      include_granted_scopes: true,
    });
  }
  getTokens(code: string): Promise<Tokens> {
    return new Promise((resolve, reject) => {
      this.googleOAuth.getToken(code, (err, tokens) => {
        if (err) {
          reject(err);
        } else if (!tokens) {
          reject(new Error('Failed to fetch tokens'));
        } else {
          resolve({
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            idToken: tokens.id_token!,
            tokenType: tokens.token_type!,
            scope: tokens.scope!,
            expiresAt: tokens.expiry_date!,
          });
        }
      });
    });
  }
  getProfile = async (accessToken: string): Promise<Profile> => {
    this.googleOAuth.setCredentials({ access_token: accessToken });
    const resp = await this.googleOAuth.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    if (resp.status !== 200) {
      throw new Error('Failed to fetch profile');
    }
    const profile = resp.data as GoogleOAuthProfile;
    return {
      id: profile.sub,
      fullName: profile.name,
      friendlyName: profile.given_name,
      email: profile.email,
      avatarUrl: profile.picture,
    };
  };
}

type GoogleOAuthProfile = {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
  locale: string;
};
