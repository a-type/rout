import { Tile } from '@long-game/game-gridlock-definition/v1';
import { Token } from '@long-game/game-ui';
import { clsx } from 'clsx';
import { hooks } from '../gameClient.js';

export interface TileRendererProps {
  tile: Tile;
  className?: string;
  unplayable?: boolean;
}

export const TileRenderer = hooks.withGame<TileRendererProps>(
  function TileRenderer({ gameSuite, tile, className, unplayable }) {
    const { hand } = gameSuite.initialState;
    const isInHand = hand.some((t) => t.id === tile.id);
    const disabled = unplayable || !isInHand;
    const terminator =
      [tile.up, tile.down, tile.left, tile.right].filter(Boolean).length === 1;
    return (
      <Token
        id={tile.id}
        data={tile}
        disabled={disabled}
        className={clsx('aspect-1 relative', className)}
        draggedClassName="w-[48px] h-[48px] relative"
      >
        <div
          className={clsx(
            'absolute inset-0',
            'rounded-sm',
            isInHand && 'border-default bg-white',
            unplayable && 'opacity-50',
          )}
          data-left={tile.left}
          data-right={tile.right}
          data-up={tile.up}
          data-down={tile.down}
        >
          {tile.down && <RoadPiece className="rotate-0" data-down />}
          {tile.up && <RoadPiece data-up className="rotate-180" />}
          {tile.left && <RoadPiece className="rotate-90" data-left />}
          {tile.right && <RoadPiece className="rotate-270" data-right />}
          {terminator && <CenterPoint />}
        </div>
      </Token>
    );
  },
);

function RoadPiece({ className, ...rest }: { className?: string }) {
  return (
    <div
      className={clsx(
        'absolute top-1/2 left-1/2 transform-origin-t',
        'w-4px h-[calc(50%+4px)] bg-main-dark',
        '-translate-x-1/2',
        className,
      )}
      {...rest}
    />
  );
}

function CenterPoint() {
  return (
    <div
      className={clsx(
        'w-1/4 h-1/4 bg-main-dark rounded-full',
        'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
      )}
    />
  );
}
