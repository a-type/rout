import { Tile } from '@long-game/game-gridlock-definition/v1';
import { Token } from '@long-game/game-ui';
import { clsx } from 'clsx';
import { hooks } from '../gameClient.js';

export interface TileRendererProps {
  tile: Tile;
  className?: string;
}

export const TileRenderer = hooks.withGame<TileRendererProps>(
  function TileRenderer({ gameSuite, tile, className }) {
    const { hand } = gameSuite.initialState;
    return (
      <Token
        id={tile.id}
        disabled={!hand.some((t) => t.id === tile.id)}
        className={clsx('aspect-1 relative', className)}
        draggedClassName="w-[48px] h-[48px] relative"
      >
        <div
          className={clsx(
            'absolute inset-0',
            'border-default bg-white rounded-sm',
          )}
        >
          {tile.down && <RoadPiece className="rotate-0" data-down />}
          {tile.up && <RoadPiece data-up className="rotate-180" />}
          {tile.left && <RoadPiece className="rotate-90" data-left />}
          {tile.right && <RoadPiece className="rotate-270" data-right />}
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
        'w-4px h-1/2 bg-main-dark',
        className,
      )}
      {...rest}
    />
  );
}
