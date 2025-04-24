import { Box } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { GameRoundRenderer, GameRoundRendererProps } from '@long-game/game-definition';

export const DefaultRoundRenderer: GameRoundRenderer = withGame<GameRoundRendererProps<any>>(
  function DefaultRoundRenderer({ round }) {
    return <Box p>Round {round.roundIndex + 1}</Box>;
  },
);
