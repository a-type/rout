import { BaseTurnData, GameDefinition } from '@long-game/game-definition';
import {
  useCombinedLog as useBaseCombinedLog,
  usePriorRounds as useBasePriorRounds,
  useChat,
} from './useLogs.js';
import { usePlayer, usePlayerId, usePlayers } from './usePlayers.js';
import { usePlayerState as useBasePlayerState } from './usePlayerState.js';
import { useCurrentTurn as useBaseCurrentTurn } from './useTurn.js';

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
    return useBasePlayerState<PlayerState, TurnData>();
  }
  function useCurrentTurn(opts: { onError?: (error: string) => void } = {}) {
    return useBaseCurrentTurn<TurnData>(opts);
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
    usePlayers,
    usePlayer,
    usePlayerId,
  };
}
