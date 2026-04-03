import { GameSession } from '@long-game/game-client';
import { GameSummaryCard } from '../games/sessions/GameSummaryCard';
import { LiveGameSessionMenu } from '../games/sessions/LiveGameSessionMenu';
import { GameSessionMemberAvatars } from '../memberships/GameSessionMemberAvatars';

export interface InviteCardProps {
  session: GameSession;
  className?: string;
}

export function InviteCard({ session, className }: InviteCardProps) {
  return (
    <GameSummaryCard session={session} className={className}>
      <GameSummaryCard.Trigger>
        <GameSummaryCard.Icon className="opacity-50" />
        <GameSummaryCard.Details>
          <GameSummaryCard.Title />
          <GameSessionMemberAvatars sessionId={session.id} />
          <div>
            {session.invitationStatus === 'pending' ? (
              "You're invited!"
            ) : (
              <span>Waiting...</span>
            )}
          </div>
        </GameSummaryCard.Details>
      </GameSummaryCard.Trigger>
      <GameSummaryCard.Menu>
        <LiveGameSessionMenu
          sessionId={session.id}
          canAbandon
          canDelete={session.canDelete}
        />
      </GameSummaryCard.Menu>
    </GameSummaryCard>
  );
}
