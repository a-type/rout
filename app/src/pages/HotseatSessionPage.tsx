import { GameSessionRenderer } from '@/components/games/GameSessionRenderer';
import { ErrorBoundary } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { useParams } from '@verdant-web/react-router';

const HotseatSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: PrefixedId<'gs'> }>();
  return (
    <ErrorBoundary fallback={<div>Ooops, something went wrong 😥.</div>}>
      <GameSessionRenderer gameSessionId={sessionId} hotseat />
    </ErrorBoundary>
  );
};

export default HotseatSessionPage;
