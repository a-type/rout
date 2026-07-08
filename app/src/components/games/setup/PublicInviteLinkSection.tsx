import { Box, P } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { PublicInviteLink } from '../../memberships/PublicInviteLink.js';
import cls from './PublicInviteLinkSection.module.css';

export function PublicInviteLinkSection({
  sessionId,
}: {
  sessionId: PrefixedId<'gs'>;
}) {
  return (
    <Box col gap="sm" surface p>
      <Box gap items="center" className={cls.layout}>
        <div style={{ whiteSpace: 'nowrap' }}>Join link:</div>
        <PublicInviteLink gameSessionId={sessionId} />
      </Box>
      <P emphasis="ambient" dim className={cls.disclaimer}>
        Be careful with this link, anyone who has it can join this game.
      </P>
    </Box>
  );
}
