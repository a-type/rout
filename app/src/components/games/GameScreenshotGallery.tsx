import { useGame } from '@/hooks/useGame';
import { Box, Button, clsx } from '@a-type/ui';
import { useState } from 'react';

export interface GameScreenshotGalleryProps {
  gameId: string;
  className?: string;
}

export function GameScreenshotGallery({
  gameId,
  className,
}: GameScreenshotGalleryProps) {
  const game = useGame(gameId);
  const [selected, setSelected] = useState<number>(0);
  const screenshot = game.screenshots?.[selected];

  return (
    <Box gap className={clsx('', className)}>
      <img
        key={screenshot.file}
        src={`/game-data/${game.id}/screenshots/${screenshot.file}`}
        alt={screenshot.alt}
        className="object-contain bg-primary-wash min-w-0 w-auto h-auto rounded-md border border-default flex-[1-1-0]"
      />
      <Box col gap="sm" className="flex-[1-1-auto]">
        {game.screenshots.map((screenshot, index) => (
          <Button
            key={screenshot.file}
            onClick={() => setSelected(index)}
            color={selected === index ? 'accent' : 'default'}
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
