import { hookifySdk, PublicSdk, SdkHooks } from '@long-game/game-client';

export const sdkHooks: SdkHooks<PublicSdk> = hookifySdk<PublicSdk>();
