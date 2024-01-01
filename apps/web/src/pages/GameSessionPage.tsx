import { GameSession } from '@/components/games/GameSession.jsx';
import { usePlayerSession } from '@long-game/game-client';
import { useParams } from '@verdant-web/react-router';
// import { Spinner } from '@a-type/ui/components/spinner';

export interface GameSessionPageProps {}

export function GameSessionPage({}: GameSessionPageProps) {
  const { sessionId } = useParams();
  const { data: session } = usePlayerSession({ id: sessionId });
  if (!session) {
    return null;
    // return <Spinner />;
  }
  return <GameSession session={session} />;
}

export default GameSessionPage;
