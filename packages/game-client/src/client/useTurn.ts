import { useCallback, useState } from 'react';
import { useLocalStorage } from '../useStorage.js';
import { GameSessionTypes } from './ambientTypes.js';
import { gameSessionFragment, useGameSession } from './useGameSession.js';
import { useGameSessionId } from './useSessionId.js';
import { useGameDefinition } from './GameDefinitions.jsx';
import { graphql } from '@long-game/graphql';
import { useMutation } from '@apollo/client';
import { BaseTurnData, GameDefinition } from '@long-game/game-definition';

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type Updater<T> = Dispatch<SetStateAction<T>>;

export function useLocalTurnData(): readonly [
  GameSessionTypes['TurnData'] | undefined,
  Updater<GameSessionTypes['TurnData'] | undefined>,
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
  gameDefinition: GameDefinition<any, any, TurnData, BaseTurnData>;
  onError?: (error: string) => void;
}): {
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
  const [localTurnData, setLocalTurnData] = useLocalTurnData();
  const [error, setError] = useState<string | null>(null);
  const gameDefinition = useGameDefinition(session.gameId);
  const [sendTurn, { loading }] = useMutation(sendTurnMutation);
  const prepareTurn = useCallback(
    async (turn: GameSessionTypes['TurnData']) => {
      const error = gameDefinition.validateTurn({
        playerState: session.state.playerState,
        turn: {
          data: turn,
          userId: playerState.playerId,
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
    },
    [localTurnData, prepareTurn, sendTurn, session.id],
  );
  const resetTurn = useCallback(() => {
    setLocalTurnData(undefined);
  }, [setLocalTurnData]);
  return {
    currentTurn: localTurnData ?? serverTurn?.data,
    prepareTurn,
    submitTurn,
    dirty: !!localTurnData,
    error,
    submitting: loading,
    resetTurn,
  };
}
