import { Box, clsx, Icon } from '@a-type/ui';
import { GameIcon } from '../GameIcon.js';
import { GameManualDialog } from '../GameManualDialog.js';
import { GameTitle } from '../GameTitle.js';

export function GameSelectionBanner({ gameId }: { gameId: string | null }) {
  if (!gameId || gameId === 'empty') {
    return null;
  }
  return (
    <Box p className="anchor-gameselection">
      <div className="absolute inset-0 z-0">
        <GameIcon
          gameId={gameId}
          className="-inset-10% w-120% h-auto absolute z-0 blur-lg"
        />
      </div>
      <div className="w-full relative z-1 text-xl color-white flex gap-md items-center">
        <GameIcon
          gameId={gameId}
          className="h-48px aspect-1 rounded-sm border-black border-thin border-solid"
        />
        <div className="bg-black/60 px-sm py-xs rounded-sm">
          <GameTitle gameId={gameId} />
        </div>
        <GameManualDialog className="ml-auto" emphasis="contrast" size="small">
          <Icon name="book" />
          How to play
        </GameManualDialog>
      </div>
      <div
        className={clsx(
          'anchor-to-gameselection fixed top-[anchor(top)] left-[anchor(left)] z-100',
          'animate-bounce',
        )}
      >
        <div
          className={clsx(
            '-translate-y-1/2 md:(-translate-1/2 -rotate-30)',
            'bg-primary text-contrast rd-sm px-sm py-xs',
            'text-sm font-bold border-thin border-solid border-main-ink shadow-lg',
          )}
        >
          Playing!
        </div>
      </div>
    </Box>
  );
}
