import {
  isEmptyTile,
  isTerminatorTile,
  Tile,
} from '@long-game/game-gridlock-definition/v1';
import { Token } from '@long-game/game-ui';
import { clsx } from 'clsx';
import { hooks } from '../gameClient.js';
import { TileRenderer, TileRendererProps } from './TileRenderer.js';

export interface TileTokenProps extends TileRendererProps {
  tile: Tile;
  className?: string;
  unplayable?: boolean;
  illegal?: boolean;
}

export const TileToken = hooks.withGame<TileTokenProps>(function TileToken({
  gameSuite,
  tile,
  className,
  unplayable,
  illegal,
  ...rest
}) {
  const { hand } = gameSuite.initialState;
  const isInHand = hand.some((t) => t.id === tile.id);
  const disabled = unplayable || !isInHand;

  const rulesId = unplayable
    ? 'unplaceable-tiles'
    : illegal
      ? '#illegal-placement'
      : isTerminatorTile(tile)
        ? 'end-tile'
        : isEmptyTile(tile)
          ? 'blank-tile'
          : 'tile';
  const helpContent = unplayable
    ? 'This tile cannot be placed on the board.'
    : illegal
      ? 'This tile cannot be placed here.'
      : isTerminatorTile(tile)
        ? 'This tile can be placed anywhere on the board, and counts as a path end.'
        : isEmptyTile(tile)
          ? "This tile can be placed anywhere on the board, but isn't part of any path."
          : disabled
            ? 'This is a path tile.'
            : 'This is a path tile. Drag it onto your board!';

  return (
    <Token
      id={tile.id}
      data={tile}
      disabled={disabled}
      className={clsx('aspect-1 relative', className)}
      draggedClassName="w-[48px] h-[48px] relative"
      movedBehavior="fade"
      tags={['tile']}
      rulesId={rulesId}
      helpContent={helpContent}
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
