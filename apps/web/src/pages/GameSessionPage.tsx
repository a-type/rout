import {
  GameRecap,
  postGameSessionFragment,
} from '@/components/games/GameRecap.js';
import { GameSession } from '@/components/games/GameSession.js';
import {
  GameSetup,
  gameSetupSessionFragment,
} from '@/components/games/GameSetup.js';
import { PageContent, PageRoot, Spinner } from '@a-type/ui';
import { graphql, useSuspenseQuery } from '@long-game/game-client';
import { useParams } from '@verdant-web/react-router';

const gameSessionPageQuery = graphql(
  `
    query GameSessionPage($id: ID!) {
      gameSession(id: $id) {
        id
        startedAt
        state {
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
    return (
      <PageRoot>
        <PageContent>
          <GameSetup gameSession={session} onRefetch={refetch} />
        </PageContent>
      </PageRoot>
    );
  } else if (session.state.status === 'completed') {
    return (
      <PageRoot>
        <PageContent>
          <GameRecap gameSession={session} />
        </PageContent>
      </PageRoot>
    );
  }
  return <GameSession gameSessionId={sessionId} />;
}

export default GameSessionPage;
