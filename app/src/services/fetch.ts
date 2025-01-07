import { createFetch } from '@a-type/auth-client';
import { LongGameError } from '@long-game/common';

export const fetch = createFetch({
  isSessionExpired: (res) => {
    const asLongGameError = LongGameError.fromResponse(res);
    if (asLongGameError?.code === LongGameError.Code.SessionExpired) {
      return true;
    }
    return false;
  },
  refreshSessionEndpoint: `${
    import.meta.env.VITE_PUBLIC_API_ORIGIN
  }/auth/refresh`,
  headers: {
    'x-csrf-token': 'csrf',
  },
});
