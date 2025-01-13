import { createFetch } from '@a-type/auth-fetch';
import { LongGameError } from '@long-game/common';
import { API_ORIGIN, HOME_ORIGIN } from './config.js';

export const fetch = createFetch({
  refreshSessionEndpoint: `${API_ORIGIN}/auth/refresh`,
  isSessionExpired: (res) => {
    const longGameError = LongGameError.fromResponse(res);
    if (longGameError) {
      return longGameError.code === LongGameError.Code.SessionExpired;
    }
    return false;
  },
});

export function login() {
  window.location.href =
    HOME_ORIGIN +
    '/login' +
    '?returnTo=' +
    encodeURIComponent(window.location.href);
}
