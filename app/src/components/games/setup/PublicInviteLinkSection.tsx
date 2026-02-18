import { Box, P } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { PublicInviteLink } from '../../memberships/PublicInviteLink.js';

export function PublicInviteLinkSection({
  sessionId,
}: {
  sessionId: PrefixedId<'gs'>;
}) {
  return (
    <Box col gap="sm" surface p>
      <Box
        gap
        items="center"
        d={{
          default: 'col',
          md: 'row',
        }}
      >
        <div className="text-nowrap">Join link:</div>
        <PublicInviteLink gameSessionId={sessionId} />
      </Box>
      <P className="text-xs w-full text-center">
        Be careful with this link, anyone who has it can join this game.
      </P>
    </Box>
  );
}
