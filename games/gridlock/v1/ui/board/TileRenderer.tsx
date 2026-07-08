import { clsx } from 'clsx';
import { isTerminatorTile, serializeTile, Tile } from '../../definition/index';
import { EndDecorations } from './tileImages/EndDecorations.js';
import { tileImages } from './tileImages/index.js';
import cls from './TileRenderer.module.css';

export interface TileRendererProps {
  tile: Tile;
  className?: string;
  pathIsBroken?: boolean;
  pathIsComplete?: boolean;
}

export function TileRenderer({
  tile,
  className,
  pathIsBroken,
  pathIsComplete,
}: TileRendererProps) {
  const image = tileImages[serializeTile(tile)];

  return (
    <div
      className={clsx(
        cls.root,
        pathIsBroken && '@mode-neutral',
        pathIsComplete && '@mode-success',
        className,
      )}
      data-left={tile.left}
      data-right={tile.right}
      data-up={tile.up}
      data-down={tile.down}
    >
      <image.Component
        style={{ transform: `rotate(${image.rotation}deg)` }}
        className={cls.image}
      />
      {isTerminatorTile(tile) && <EndDecorations />}
    </div>
  );
}
