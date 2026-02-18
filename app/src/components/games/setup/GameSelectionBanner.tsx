import { Box } from '@a-type/ui';
import { GameIcon } from '../GameIcon.js';
import { GameTitle } from '../GameTitle.js';

export function GameSelectionBanner({ gameId }: { gameId: string }) {
  return (
    <Box surface p border elevated="md" className="relative overflow-clip">
      <GameIcon
        gameId={gameId}
        className="object-cover object-center w-full h-full inset-0 absolute z-0"
      />
      <div className="relative z-1 text-lg color-white bg-black/30 rounded-sm px-sm py-xs">
        <GameTitle gameId={gameId} />
      </div>
    </Box>
  );
}
