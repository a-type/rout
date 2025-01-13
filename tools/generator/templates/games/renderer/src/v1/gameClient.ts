import { create } from '@long-game/game-client/client';
import { gameDefinition } from '@long-game/game-{{name}}-definition/v1';

export const {
  useCurrentTurn,
  usePriorRounds,
  usePlayerState,
  useChat,
  useCombinedLog,
  usePlayer,
  usePlayerId,
  usePlayers,
} = create(gameDefinition);
