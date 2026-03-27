import { GameSessionRenderer } from '@/components/games/GameSessionRenderer';
import { PrefixedId } from '@long-game/common';
import { useParams } from '@verdant-web/react-router';

const HotseatSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: PrefixedId<'gs'> }>();
  return <GameSessionRenderer gameSessionId={sessionId} hotseat />;
};

export default HotseatSessionPage;
