import {
  hasAnyValidPlacement,
  Tile,
} from '@long-game/game-gridlock-definition/v1';
import { TokenHand } from '@long-game/game-ui';
import { TileRenderer } from '../board/TileRenderer.js';
import { hooks } from '../gameClient.js';

export interface TileHandProps {}

export const TileHand = hooks.withGame<TileHandProps>(function TileHand({
  gameSuite,
}) {
  const { hand, board } = gameSuite.finalState;
  return (
    <TokenHand<Tile>
      // when a tile is dropped into hand, remove it from placements
      onDrop={(tile) => {
        gameSuite.prepareTurn((cur) => {
          return {
            placements: cur.placements.filter((p) => p.tileId !== tile.id),
          };
        });
      }}
      className="w-full min-h-[48px] border-default rounded-sm p-xs bg-white"
    >
      {hand.map((tile) => {
        const unplayable = !hasAnyValidPlacement({
          board,
          tile,
        });
        return (
          <TileRenderer
            key={tile.id}
            tile={tile}
            className="layer-components:h-[48px]"
            unplayable={unplayable}
          />
        );
      })}
    </TokenHand>
  );
});
