import { Box, HorizontalList } from '@a-type/ui';
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
        <PublicInviteLinkSection sessionId={gameSessionId} />
        <HorizontalList>
          {Object.values(gameSuite.players).map((player) => (
            <PlayerAvatar playerId={player.id} key={player.id} size={80} />
          ))}
        </HorizontalList>
        <GameSetupInviteFriends />
      </Box>
    );
  },
);
