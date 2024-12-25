import { useSubscription } from '@apollo/client';
import { BaseTurnData } from '@long-game/game-definition';
import { graphql } from '@long-game/graphql';
import { useGameDefinition } from './GameDefinitions.jsx';
import { gameSessionStateFragment, useGameSession } from './useGameSession.js';
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

export function usePlayerState<S, T extends BaseTurnData>(): S {
  const session = useGameSession();
  const { currentTurn } = useCurrentTurn<T>();
  const definition = useGameDefinition(session.gameId, session.gameVersion);

  // subscribe to state updates here
  useSubscription(gameStateSubscription, {
    variables: { gameSessionId: session.id },
  });

  return currentTurn
    ? definition.getProspectivePlayerState({
        playerState: session.state.playerState,
        playerId: session.state.playerId,
        prospectiveTurn: {
          data: currentTurn,
          playerId: session.state.playerId,
        },
      })
    : session.state.playerState;
}
