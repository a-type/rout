import { GameJoinPreview } from '@/components/games/GameJoinPreview';
import { GameSessionRenderer } from '@/components/games/GameSessionRenderer';
import { sdkHooks } from '@/services/publicSdk';
import { ErrorBoundary } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { useParams } from '@verdant-web/react-router';

export function GameSessionPage() {
  const { sessionId } = useParams<{
    sessionId: PrefixedId<'gs'>;
  }>();

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
    <ErrorBoundary fallback={<div>Ooops, something went wrong 😥.</div>}>
      <GameSessionRenderer gameSessionId={sessionId} pregame={pregame} />
    </ErrorBoundary>
  );
}

export default GameSessionPage;
