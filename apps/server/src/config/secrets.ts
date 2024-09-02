import { assert } from '@a-type/utils';

export const GAME_SESSION_TOKEN_SECRET = process.env.GAME_SESSION_TOKEN_SECRET!;
assert(GAME_SESSION_TOKEN_SECRET, 'GAME_SESSION_TOKEN_SECRET must be set');
