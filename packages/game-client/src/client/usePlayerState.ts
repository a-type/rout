import { useSubscription } from '@apollo/client';
import { useGameDefinition } from './GameDefinitions.jsx';
import { gameSessionStateFragment, useGameSession } from './useGameSession.js';
import { useCurrentTurn } from './useTurn.js';
import { graphql } from '@long-game/graphql';
import { GameSessionTypes } from './ambientTypes.js';

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

export function usePlayerState<T = GameSessionTypes['PlayerState']>(): T {
  const session = useGameSession();
  const { currentTurn } = useCurrentTurn();
  const definition = useGameDefinition(session.gameId);

  // subscribe to state updates here
  useSubscription(gameStateSubscription, {
    variables: { gameSessionId: session.id },
  });

  return currentTurn
    ? definition.getProspectivePlayerState({
        playerState: session.state.playerState,
        playerId: session.state.playerId,
        prospectiveTurn: currentTurn,
      })
    : session.state.playerState;
}
