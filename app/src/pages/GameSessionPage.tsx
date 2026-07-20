import { GameJoinPreview } from '@/components/games/GameJoinPreview';
import { GameSessionRenderer } from '@/components/games/GameSessionRenderer';
import { sdkHooks } from '@/services/publicSdk';
import { ErrorBoundary } from '@a-type/ui';
import { isPrefixedId } from '@long-game/common';
import { useParams } from '@tanstack/react-router';

export function GameSessionPage() {
  const { sessionId } = useParams({
    from: '/session/$sessionId',
  });

  if (!isPrefixedId(sessionId, 'gs')) {
    throw new Error(`Invalid sessionId: ${sessionId}`);
  }

  // if player is only invited but not a member, don't join them to
  // the game session state yet
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: sessionId,
  });
  const pendingInviteForMe =
    pregame.myInvitation.status === 'pending' ? pregame.myInvitation : null;

  if (pendingInviteForMe) {
    return <GameJoinPreview myInvite={pendingInviteForMe} pregame={pregame} />;
  }

  return (
    <ErrorBoundary fallback={<div>Oops, something went wrong 😥.</div>}>
      <GameSessionRenderer gameSessionId={sessionId} />
    </ErrorBoundary>
  );
}

export default GameSessionPage;
