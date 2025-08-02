import { PrefixedId } from '@long-game/common';
import { useEffect } from 'react';
import { useSdk, useSuspenseQuery } from '../api/hooks.js';
import { PublicSdk } from '../api/PublicSdk.js';
import { GameModuleContext } from '../federation/gameModuleContext.js';
import { AbstractGameSuite } from './AbstractGameSuite.js';
import { GameSessionSuite } from './GameSessionSuite.js';
import { HotseatGameSuite } from './HotseatGameSuite.js';

export function useCreateGameSuite(
  gameSessionId: PrefixedId<'gs'>,
  gameModules: GameModuleContext,
  hotseat?: boolean,
) {
  const sdk = useSdk() as PublicSdk;
  const { data: gameSuite } = useSuspenseQuery<AbstractGameSuite<any>>({
    queryFn: () => {
      if (hotseat) {
        return HotseatGameSuite.load(gameSessionId, gameModules);
      }
      return GameSessionSuite.load(gameSessionId, gameModules, sdk);
    },
    queryKey: ['gameSession', gameSessionId],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  useEffect(() => gameSuite.connect(), [gameSuite]);
  // for debugging
  (window as any).gameSuite = gameSuite;
  return gameSuite;
}
