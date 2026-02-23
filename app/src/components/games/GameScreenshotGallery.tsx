import { useGame } from '@/hooks/useGame';
import { Box, Button, clsx } from '@a-type/ui';
import { useState } from 'react';

export interface GameScreenshotGalleryProps {
  gameId: string;
  /** Optional, defaults to latest version */
  version?: string;
  className?: string;
}

export function GameScreenshotGallery({
  gameId,
  version: userVersion,
  className,
}: GameScreenshotGalleryProps) {
  const game = useGame(gameId);
  const version = userVersion ?? game?.latestVersion ?? 'v1';
  const [selected, setSelected] = useState<number>(0);
      const availableScreenshots = game.screenshots?.filter((screenshot) =>
        !screenshot.version || screenshot.version === version,
      );
  const screenshot = availableScreenshots?.[selected];


  return (
    <Box gap className={clsx('', className)}>
      <img
        key={screenshot.file}
        src={`/game-data/${game.id}/screenshots/${screenshot.file}`}
        alt={screenshot.alt}
        className="object-contain bg-main-wash min-w-0 w-auto h-auto rounded-md border border-default flex-[1-1-0]"
      />
      <Box col gap="sm" className="flex-[1-1-auto]">
        {availableScreenshots.map((screenshot, index) => (
          <Button
            key={screenshot.file}
            onClick={() => setSelected(index)}
            color="accent"
            emphasis={selected === index ? 'primary' : 'default'}
            className={clsx('p-0 overflow-hidden')}
            visuallyFocused={selected === index}
          >
            <img
              src={`/game-data/${game.id}/screenshots/${screenshot.file}`}
              alt={screenshot.alt}
              className="w-20 object-cover rounded aspect-1"
            />
          </Button>
        ))}
      </Box>
    </Box>
  );
}
