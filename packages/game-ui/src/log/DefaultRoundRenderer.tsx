import { Box } from '@a-type/ui';
import { GameRoundSummary } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface DefaultRoundRendererProps {
  round: GameRoundSummary<any, any, any>;
}

export const DefaultRoundRenderer = withGame<DefaultRoundRendererProps>(
  function DefaultRoundRenderer({ round, gameSuite }) {
    return <Box p>Round {round.roundIndex + 1}</Box>;
  },
);
