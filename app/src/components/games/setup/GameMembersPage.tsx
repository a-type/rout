import { Box, H2, HorizontalList } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { GameSetupInviteFriends } from './GameSetupInviteFriends.js';
import { PublicInviteLinkSection } from './PublicInviteLinkSection.js';

export interface GameMembersPageProps {
  gameSessionId: PrefixedId<'gs'>;
}

export const GameMembersPage = withGame<GameMembersPageProps>(
  function GameMembersPage({ gameSessionId, gameSuite }) {
    return (
      <Box col gap>
        <H2>Who's playing?</H2>
        <HorizontalList>
          {Object.values(gameSuite.players).map((player) => (
            <PlayerAvatar playerId={player.id} key={player.id} />
          ))}
        </HorizontalList>
        <PublicInviteLinkSection sessionId={gameSessionId} />
        <GameSetupInviteFriends />
      </Box>
    );
  },
);
