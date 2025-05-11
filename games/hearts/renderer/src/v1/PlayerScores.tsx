import { Box } from '@a-type/ui';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { hooks } from './gameClient';

export interface PlayerScoresProps {}

export const PlayerScores = hooks.withGame<PlayerScoresProps>(
  function PlayerScores({ gameSuite }) {
    return (
      <Box gap>
        {gameSuite.members.map((member) => (
          <Box key={member.id} gap surface="wash" className="flex items-center">
            <Box>
              <PlayerAvatar playerId={member.id} />
              <PlayerName playerId={member.id} />
            </Box>
            <Box className="font-bold">
              {gameSuite.finalState.scores[member.id]}
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
);
