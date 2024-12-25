import { useMutation } from '@apollo/client';
import { BaseTurnData } from '@long-game/game-definition';
import { graphql } from '@long-game/graphql';
import { useCallback, useState } from 'react';
import { useLocalStorage } from '../useStorage.js';
import { useGameDefinition } from './GameDefinitions.jsx';
import { gameSessionFragment, useGameSession } from './useGameSession.js';
import { useGameSessionId } from './useSessionId.js';

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type Updater<T> = Dispatch<SetStateAction<T>>;

export function useLocalTurnData<TurnData>(): readonly [
  TurnData | undefined,
  Updater<TurnData | undefined>,
] {
  const sessionId = useGameSessionId();
  return useLocalStorage<any>(`${sessionId}:localTurnData`, undefined, false);
}

const sendTurnMutation = graphql(
  `
    mutation ClientSendTurn($input: SubmitTurnInput!) {
      submitTurn(input: $input) {
        gameSession {
          id
          ...ClientSession
        }
      }
    }
  `,
  [gameSessionFragment],
);

export function useCurrentTurn<TurnData extends BaseTurnData>({
  onError,
}: {
  onError?: (error: string) => void;
} = {}): {
  currentTurn: TurnData | null;
  prepareTurn: Updater<TurnData>;
  submitTurn: (data?: TurnData) => Promise<void>;
  resetTurn: () => void;
  dirty: boolean;
  error: string | null;
  submitting: boolean;
} {
  const session = useGameSession();
  const { currentTurn: serverTurn, playerState } = session.state;
  const [localTurnData, setLocalTurnData] = useLocalTurnData<TurnData>();
  const [error, setError] = useState<string | null>(null);
  const gameDefinition = useGameDefinition(session.gameId, session.gameVersion);
  const [sendTurn, { loading }] = useMutation(sendTurnMutation);
  const prepareTurn = useCallback(
    async (turn: unknown) => {
      const error = gameDefinition.validateTurn({
        playerState: session.state.playerState,
        turn: {
          data: turn,
          playerId: playerState.playerId,
        },
        members: session.members.map((member) => member.user),
        roundIndex: session.state.currentTurn?.roundIndex ?? 0,
      });
      if (error) {
        setError(error);
        if (onError) {
          onError(error);
        }
        return;
      }
      setLocalTurnData(turn as any);
    },
    [setLocalTurnData, session, gameDefinition, playerState],
  );
  const submitTurn = useCallback(
    async (dataOverride?: TurnData) => {
      if (dataOverride) {
        prepareTurn(dataOverride);
      }
      await sendTurn({
        variables: {
          input: {
            gameSessionId: session.id,
            turn: {
              data: localTurnData,
            },
          },
        },
      });
      setLocalTurnData(undefined);
    },
    [localTurnData, prepareTurn, sendTurn, session.id],
  );
  const resetTurn = useCallback(() => {
    setLocalTurnData(undefined);
  }, [setLocalTurnData]);
  return {
    currentTurn: localTurnData ?? (serverTurn?.data as any),
    prepareTurn,
    submitTurn,
    dirty: !!localTurnData,
    error,
    submitting: loading,
    resetTurn,
  };
}
