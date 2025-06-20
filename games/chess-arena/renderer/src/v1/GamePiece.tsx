import { clsx } from '@a-type/ui';
import { colors } from '@long-game/common';
import { PieceData } from '@long-game/game-chess-arena-definition/v1';
import { toJS } from '@long-game/game-client';
import { Token } from '@long-game/game-ui';
import { Sprite } from '@long-game/game-ui/genericGames';
import spriteSheet from '../assets/pieces.png';
import { hooks } from './gameClient';

const sheetData = {
  pawn: { x: 0, y: 0, width: 6, height: 6 },
  bishop: { x: 6, y: 0, width: 7, height: 6 },
  king: { x: 13, y: 0, width: 7, height: 6 },
  rook: { x: 0, y: 6, width: 6, height: 6 },
  knight: { x: 6, y: 6, width: 7, height: 6 },
  queen: { x: 13, y: 6, width: 7, height: 6 },
};

export interface GamePieceProps {
  piece: PieceData;
  className?: string;
  variant?: 'movedAway';
}

export const GamePiece = hooks.withGame<GamePieceProps>(function GamePiece({
  gameSuite,
  piece,
  className,
  variant,
}) {
  const player = gameSuite.getPlayer(piece.playerId);
  const tint = player ? colors[player.color].default : undefined;

  return (
    // FIXME: breaking game-client abstraction of MobX here -- since token data
    // must be freezable, and mobx reactives are not...
    <Token
      id={variant === 'movedAway' ? `${piece.id}-movedAway` : piece.id}
      data={toJS(piece)}
      className={className}
      draggedClassName="!w-[80px] !h-[80px]"
      disabled={piece.playerId !== gameSuite.playerId}
    >
      <Sprite
        sheetSrc={spriteSheet}
        sheetData={sheetData}
        spriteName={piece.type}
        tint={tint}
        className={clsx('w-full h-full image-render-pixel')}
      />
    </Token>
  );
});
