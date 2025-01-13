import { GameSessionSdk, hookifySdk } from '@long-game/game-client';
import { gameDefinition } from '@long-game/game-territory-definition/v1';

export const hooks = hookifySdk<GameSessionSdk<typeof gameDefinition>>();
