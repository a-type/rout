import { createFetch } from '@a-type/auth-fetch';
import { API_ORIGIN, HOME_ORIGIN } from './config.js';

export const fetch = createFetch({
  refreshSessionEndpoint: `${API_ORIGIN}/auth/refresh`,
  logoutEndpoint: `${API_ORIGIN}/auth/logout`,
});

export function login() {
  window.location.href =
    HOME_ORIGIN +
    '/login' +
    '?returnTo=' +
    encodeURIComponent(window.location.href);
}
