import { hookifySdk, PublicSdk } from '@long-game/game-client';

export const publicSdk = new PublicSdk();

export const sdkHooks = hookifySdk<PublicSdk>();
