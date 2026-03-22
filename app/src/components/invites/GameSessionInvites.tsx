import { sdkHooks } from '@/services/publicSdk';
import { Box, H2 } from '@a-type/ui';
import { InviteCard } from './InviteCard';

export interface GameSessionInvitesProps {
  className?: string;
}

export function GameSessionInvites({ className }: GameSessionInvitesProps) {
  const {
    data: { results: inviteSessions },
  } = sdkHooks.useGetGameSessions({
    status: ['pending'],
    invitationStatus: 'pending',
  });
  const {
    data: { results: pendingSessions },
  } = sdkHooks.useGetGameSessions({
    status: ['pending'],
    invitationStatus: 'accepted',
  });

  if (!inviteSessions?.length && !pendingSessions?.length) {
    return null;
  }

  return (
    <Box col gap full="width" items="stretch" className={className}>
      <H2>Game Invites</H2>
      {inviteSessions.map((session) => (
        <InviteCard key={session.id} session={session} />
      ))}
      {pendingSessions.map((session) => (
        <InviteCard key={session.id} session={session} />
      ))}
    </Box>
  );
}
