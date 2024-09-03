import { assert } from '@a-type/utils';

export const GAME_SESSION_TOKEN_SECRET = process.env.GAME_SESSION_TOKEN_SECRET!;
assert(GAME_SESSION_TOKEN_SECRET, 'GAME_SESSION_TOKEN_SECRET must be set');

export const GOOGLE_AUTH_CLIENT_ID = process.env.GOOGLE_AUTH_CLIENT_ID!;
assert(GOOGLE_AUTH_CLIENT_ID, 'GOOGLE_AUTH_CLIENT_ID must be set');

export const GOOGLE_AUTH_CLIENT_SECRET = process.env.GOOGLE_AUTH_CLIENT_SECRET!;
assert(GOOGLE_AUTH_CLIENT_SECRET, 'GOOGLE_AUTH_CLIENT_SECRET must be set');
