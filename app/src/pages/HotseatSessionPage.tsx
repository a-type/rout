import { GameSessionRenderer } from '@/components/games/GameSessionRenderer';
import { isPrefixedId } from '@long-game/common';
import { useParams } from '@tanstack/react-router';

const HotseatSessionPage = () => {
  const { sessionId } = useParams({
    from: '/hotseat/$sessionId',
  });
  if (!isPrefixedId(sessionId, 'gs')) {
    throw new Error(`Invalid sessionId: ${sessionId}`);
  }
  return <GameSessionRenderer gameSessionId={sessionId} hotseat />;
};

export default HotseatSessionPage;
