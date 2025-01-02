import { useSuspenseQuery } from '@apollo/client';
import { graphql } from '@long-game/graphql';
import { useGameSessionId } from './useSessionId.js';

export const gameSessionStateFragment = graphql(`
  fragment ClientSessionState on GameSessionState @_unmask {
    id
    playerId
    status
    winnerIds
    playerState(roundIndex: null)
    currentTurn {
      userId
      data
      roundIndex
    }
    currentRoundIndex
    rounds {
      roundIndex
      turns {
        data
        createdAt
        roundIndex
        player {
          id
          color
          name
        }
      }
    }
    playerStatuses {
      player {
        id
        name
        color
      }
      hasPlayedTurn
    }
  }
`);

export const gameSessionFragment = graphql(
  `
    fragment ClientSession on GameSession @_unmask {
      id
      gameId
      gameVersion
      members {
        id
        user {
          id
          name
          color
        }
      }
      state {
        id
        ...ClientSessionState
      }
    }
  `,
  [gameSessionStateFragment],
);

const gameSessionQuery = graphql(
  `
    query GameSession($id: ID!) {
      gameSession(id: $id) {
        id
        ...ClientSession
      }
    }
  `,
  [gameSessionFragment],
);

export function useMaybeGameSession() {
  const sessionId = useGameSessionId();
  const { data } = useSuspenseQuery(gameSessionQuery, {
    variables: { id: sessionId },
  });

  return data.gameSession ?? null;
}

export function useGameSession() {
  const session = useMaybeGameSession();
  if (!session) {
    throw new Error('GameSession not available');
  }
  return session;
}
