import { useSubscription, useSuspenseQuery } from '@apollo/client';
import { BaseTurnData } from '@long-game/game-definition';
import { graphql } from '@long-game/graphql';
import { useGameDefinition } from './GameDefinitions.jsx';
import { useViewingRoundIndex } from './GameHistoryContext.js';
import { gameSessionStateFragment, useGameSession } from './useGameSession.js';
import { useGameSessionId } from './useSessionId.js';
import { useCurrentTurn } from './useTurn.js';

const gameStateSubscription = graphql(
  `
    subscription ClientGameStateSubscription($gameSessionId: ID!) {
      gameSessionStateChanged(gameSessionId: $gameSessionId) {
        id
        ...ClientSessionState
      }
    }
  `,
  [gameSessionStateFragment],
);

const gameSessionStateQuery = graphql(
  `
    query UsePlayerStateGameSessionState(
      $gameSessionId: ID!
      $roundIndex: Int
    ) {
      gameSession(id: $gameSessionId) {
        id
        state {
          id
          playerState(roundIndex: $roundIndex)
        }
      }
    }
  `,
);

export function usePlayerState<S, T extends BaseTurnData>(): S {
  const [viewingRoundIndex] = useViewingRoundIndex();
  const sessionId = useGameSessionId();
  const session = useGameSession();

  const { data: gameSessionStateData } = useSuspenseQuery(
    gameSessionStateQuery,
    {
      variables: {
        gameSessionId: sessionId,
        roundIndex: viewingRoundIndex === 'current' ? null : viewingRoundIndex,
      },
    },
  );

  const viewingPlayerState =
    gameSessionStateData?.gameSession?.state.playerState;
  const { currentTurn } = useCurrentTurn<T>();
  const definition = useGameDefinition(session.gameId, session.gameVersion);

  // subscribe to state updates here
  useSubscription(gameStateSubscription, {
    variables: { gameSessionId: session.id },
    // only subscribe if we're on the current round
    skip: viewingRoundIndex !== 'current',
  });

  return currentTurn && viewingRoundIndex === 'current'
    ? definition.getProspectivePlayerState({
        playerState: viewingPlayerState,
        playerId: session.state.playerId,
        prospectiveTurn: {
          data: currentTurn,
          playerId: session.state.playerId,
        },
      })
    : viewingPlayerState;
}
