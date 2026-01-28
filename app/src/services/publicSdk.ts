import { toast } from '@a-type/ui';
import { LongGameError } from '@long-game/common';
import { hookifySdk, PublicSdk, SdkHooks } from '@long-game/game-client';
export type { BaseSdk, PublicSdk } from '@long-game/game-client';

export const publicSdk = new PublicSdk();

export const sdkHooks: SdkHooks<PublicSdk> = hookifySdk<PublicSdk>();

publicSdk.addEventListener('error', (ev) => {
  if (ev instanceof ErrorEvent) {
    const err = ev.error;
    const asLongGameError = LongGameError.wrap(err);
    if (
      asLongGameError.code === LongGameError.Code.Unauthorized ||
      asLongGameError.code === LongGameError.Code.SessionInvalid
    ) {
      const isOnLoginPage =
        typeof window !== 'undefined' &&
        window.location.pathname.endsWith('/login');
      if (!isOnLoginPage) {
        window.location.href = '/login';
      }
    } else {
      toast.error(asLongGameError.message, {
        id: asLongGameError.message,
      });
    }
  }
});
