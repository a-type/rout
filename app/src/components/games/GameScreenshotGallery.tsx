import { useGame } from '@/hooks/useGame';
import { Box, Button } from '@a-type/ui';
import { useState } from 'react';
import cls from './GameScreenshotGallery.module.css';

export interface GameScreenshotGalleryProps {
  gameId: string;
  /** Optional, defaults to latest version */
  version?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GameScreenshotGallery({
  gameId,
  version: userVersion,
  className,
  ...rest
}: GameScreenshotGalleryProps) {
  const game = useGame(gameId);
  const latestGameVersion = game.versions.at(-1);
  const version = userVersion ?? latestGameVersion?.version ?? 'v1';
  const [selected, setSelected] = useState<number>(0);
  const availableScreenshots = game.screenshots?.filter(
    (screenshot) => !screenshot.version || screenshot.version === version,
  );
  const screenshot = availableScreenshots?.[selected];

  return (
    <Box gap className={className} {...rest}>
      <img
        key={screenshot.file}
        src={`/game-data/${game.id}/screenshots/${screenshot.file}`}
        alt={screenshot.alt}
        className={cls.image}
      />
      <Box col gap="sm" grow shrink>
        {availableScreenshots.map((screenshot, index) => (
          <Button
            key={screenshot.file}
            onClick={() => setSelected(index)}
            color="accent"
            emphasis={selected === index ? 'primary' : 'default'}
            size="wrapper"
            visuallyFocused={selected === index}
          >
            <img
              src={`/game-data/${game.id}/screenshots/${screenshot.file}`}
              alt={screenshot.alt}
              className={cls.galleryItem}
            />
          </Button>
        ))}
      </Box>
    </Box>
  );
}
