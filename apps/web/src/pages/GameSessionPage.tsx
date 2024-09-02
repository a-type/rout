import { GameSession, graphql, useSuspenseQuery } from '@long-game/game-client';
import { useParams } from '@verdant-web/react-router';
import { Spinner } from '@a-type/ui/components/spinner';
import {
  GameSetup,
  gameSetupSessionFragment,
} from '@/components/games/GameSetup.jsx';
import {
  GameRecap,
  postGameSessionFragment,
} from '@/components/games/GameRecap.jsx';
import { NoGameFound } from '@/components/games/NoGameFound.jsx';

const gameSessionPageQuery = graphql(
  `
    query GameSessionPage($id: ID!) {
      gameSession(id: $id) {
        id
        startedAt
        status {
          status
        }
        ...PostGameSessionFragment
        ...GameSetupSessionFragment
      }
    }
  `,
  [postGameSessionFragment, gameSetupSessionFragment],
);

export function GameSessionPage() {
  const { sessionId } = useParams();
  const { data, refetch } = useSuspenseQuery(gameSessionPageQuery, {
    variables: { id: sessionId },
  });
  const session = data?.gameSession;
  if (!session) {
    return <Spinner />;
  }
  if (!session.startedAt) {
    return <GameSetup gameSession={session} onRefetch={refetch} />;
  } else if (session.status.status === 'completed') {
    return <GameRecap gameSession={session} />;
  }
  return <GameSession gameSessionId={sessionId} notFound={<NoGameFound />} />;
}

export default GameSessionPage;
