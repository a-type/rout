import { Tile } from '@long-game/game-gridlock-definition/v1';
import { Token } from '@long-game/game-ui';
import { clsx } from 'clsx';
import { hooks } from '../gameClient.js';
import { TileRenderer, TileRendererProps } from './TileRenderer.js';

export interface TileTokenProps extends TileRendererProps {
  tile: Tile;
  className?: string;
  unplayable?: boolean;
}

export const TileToken = hooks.withGame<TileTokenProps>(function TileToken({
  gameSuite,
  tile,
  className,
  unplayable,
  ...rest
}) {
  const { hand } = gameSuite.initialState;
  const isInHand = hand.some((t) => t.id === tile.id);
  const disabled = unplayable || !isInHand;
  return (
    <Token
      id={tile.id}
      data={tile}
      disabled={disabled}
      className={clsx('aspect-1 relative', className)}
      draggedClassName="w-[48px] h-[48px] relative"
      movedBehavior="fade"
    >
      <TileRenderer
        tile={tile}
        className={clsx(
          isInHand && 'border-default bg-white',
          unplayable && 'opacity-50',
        )}
        {...rest}
      />
    </Token>
  );
});
