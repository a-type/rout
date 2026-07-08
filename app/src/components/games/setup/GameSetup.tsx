import { Box, clsx, Heading, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { TopographyBackground } from '@long-game/game-ui';
import { GameManualDialog } from '../GameManualDialog.js';
import { GameMembersPage } from './GameMembersPage.js';
import { GameSelectionBanner } from './GameSelectionBanner.js';
import cls from './GameSetup.module.css';
import { PlayingBouncy } from './PlayingBouncy.js';
import { StartGameButton } from './StartGameButton.js';

export interface GameSetupProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const GameSetup = withGame<GameSetupProps>(function GameSetup({
  gameSessionId,
  className,
}) {
  return (
    <Box p col gap grow className={clsx(cls.root, className)}>
      <Box col gap grow>
        <Heading emphasis="ambient" render={<h1 />} bold uppercase>
          Game Setup
        </Heading>
        <GameMembersPage gameSessionId={gameSessionId} />
      </Box>
      <Box
        className={cls.banner}
        full="width"
        col
        gap
        surface="ambient"
        border
        elevated="md"
        p
      >
        <TopographyBackground />
        <GameSelectionBanner />
        <GameManualDialog
          size="small"
          className="@mode-inverted justify-center"
        >
          <Icon name="book" />
          How to play
        </GameManualDialog>
        <StartGameButton />
        <PlayingBouncy />
      </Box>
    </Box>
  );
});
