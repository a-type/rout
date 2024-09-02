import { LongGameError } from '@long-game/common';
import { API_ORIGIN, HOME_ORIGIN } from './config.js';
import { createFetch } from '@a-type/auth-client';

export { refreshSession } from '@a-type/auth-client';

export const fetch = createFetch({
  refreshSessionEndpoint: `${API_ORIGIN}/auth/refresh`,
  isSessionExpired: (res) => {
    const biscuitsError = LongGameError.fromResponse(res);
    if (biscuitsError) {
      console.error('Long Game Error', biscuitsError);
      return biscuitsError.code === LongGameError.Code.SessionExpired;
    }
    return false;
  },
  headers: {
    'x-csrf-token': 'csrf',
  },
});

export function login() {
  window.location.href =
    HOME_ORIGIN +
    '/login' +
    '?returnTo=' +
    encodeURIComponent(window.location.href);
}
