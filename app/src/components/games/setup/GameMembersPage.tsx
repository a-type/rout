import { Box, H2 } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { GameSetupInviteFriends } from './GameSetupInviteFriends.js';
import { PublicInviteLinkSection } from './PublicInviteLinkSection.js';

export interface GameMembersPageProps {
  gameSessionId: PrefixedId<'gs'>;
}

export const GameMembersPage = withGame<GameMembersPageProps>(
  function GameMembersPage({ gameSessionId }) {
    return (
      <Box col gap>
        <H2>Who's playing?</H2>
        <PublicInviteLinkSection sessionId={gameSessionId} />
        <GameSetupInviteFriends />
      </Box>
    );
  },
);
