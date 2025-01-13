import { sdkHooks } from '@/services/publicSdk';
import { Box, H1 } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface InvitationsProps {}

export function Invitations({}: InvitationsProps) {
  const { data: invitations } = sdkHooks.useGetGameSessionInvitations();

  if (!invitations.length) {
    return null;
  }

  return (
    <Box direction="col">
      <H1>Invitations</H1>
      {invitations?.map((i) => (
        <Box key={i.id} direction="row" justify="between" asChild>
          <Link to={`/session/${i.gameSessionId}`}>
            <Box>{i.gameSessionId}</Box>
            <Box>{i.status}</Box>
          </Link>
        </Box>
      ))}
    </Box>
  );
}
