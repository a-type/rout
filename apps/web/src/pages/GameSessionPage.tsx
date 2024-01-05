import { GameSession } from '@/components/games/GameSession.jsx';
import { globalHooks } from '@long-game/game-client';
import { useParams } from '@verdant-web/react-router';
import { Spinner } from '@a-type/ui/components/spinner';
import { GameSetup } from '@/components/games/GameSetup.jsx';
import { GameRecap } from '@/components/games/GameRecap.jsx';

export interface GameSessionPageProps {}

export function GameSessionPage({}: GameSessionPageProps) {
  const { sessionId } = useParams();
  const { data: session } = globalHooks.gameSessions.gameSession.useQuery({
    id: sessionId,
  });
  if (!session) {
    return <Spinner />;
  }
  if (session.status === 'pending') {
    return <GameSetup gameSession={session} />;
  } else if (session.status === 'completed') {
    return <GameRecap gameSession={session} />;
  }
  return <GameSession session={session} />;
}

export default GameSessionPage;
