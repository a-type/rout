import { sdkHooks } from '@/services/publicSdk';
import { Box, H1 } from '@a-type/ui';
import { Link } from '@tanstack/react-router';

export interface InvitationsProps {}

export function Invitations({}: InvitationsProps) {
  const { data: invitations } = sdkHooks.useGetGameSessionInvitations();

  if (!invitations.length) {
    return null;
  }

  return (
    <Box col>
      <H1>Invitations</H1>
      {invitations?.map((i) => (
        <Box
          key={i.id}
          justify="between"
          render={
            <Link
              to="/session/$sessionId"
              params={{ sessionId: i.gameSessionId }}
            />
          }
        >
          <Box>{i.gameSessionId}</Box>
          <Box>{i.status}</Box>
        </Box>
      ))}
    </Box>
  );
}
