import { Box, clsx, H1, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { TopographyBackground } from '@long-game/game-ui';
import { GameManualDialog } from '../GameManualDialog.js';
import { GameMembersPage } from './GameMembersPage.js';
import { GameSelectionBanner } from './GameSelectionBanner.js';
import { PlayingBouncy } from './PlayingBouncy.js';
import { StartGameButton } from './StartGameButton.js';

export interface GameSetupProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const GameSetup = withGame<GameSetupProps>(function GameSetup({
  gameSessionId,
  className,
  gameSuite,
}) {
  return (
    <Box p d="col" gap grow className={clsx('m-auto max-w-800px', className)}>
      <Box d="col" gap grow>
        <H1 className="text-md font-bold uppercase">Game Setup</H1>
        <GameMembersPage gameSessionId={gameSessionId} />
      </Box>
      <Box
        className="sticky bottom-sm z-1000 overflow-clip anchor-gameselection"
        full="width"
        col
        gap
        surface="white"
        border
        elevated="md"
        p
      >
        <TopographyBackground />
        <GameSelectionBanner />
        <GameManualDialog
          emphasis="contrast"
          size="small"
          className="justify-center"
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
