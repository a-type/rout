import { BaseTurnData, GameDefinition } from '@long-game/game-definition';
import { usePlayerState as useBasePlayerState } from './usePlayerState.js';
import { useCurrentTurn as useBaseCurrentTurn } from './useTurn.js';
import {
  useCombinedLog as useBaseCombinedLog,
  usePriorRounds as useBasePriorRounds,
  useChat,
} from './useLogs.js';

export function create<
  GlobalState,
  PlayerState,
  TurnData extends BaseTurnData,
  PublicTurnData extends BaseTurnData,
>(
  gameDefinition: GameDefinition<
    GlobalState,
    PlayerState,
    TurnData,
    PublicTurnData
  >,
) {
  function usePlayerState() {
    return useBasePlayerState<PlayerState>();
  }
  function useCurrentTurn(opts: { onError?: (error: string) => void } = {}) {
    return useBaseCurrentTurn({
      gameDefinition,
      ...opts,
    });
  }
  function useCombinedLog() {
    return useBaseCombinedLog<PublicTurnData>();
  }
  function usePriorRounds() {
    return useBasePriorRounds<PublicTurnData>();
  }
  return {
    usePlayerState,
    useCurrentTurn,
    useCombinedLog,
    usePriorRounds,
    useChat,
  };
}
