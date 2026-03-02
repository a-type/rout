import {
  hasAnyValidPlacement,
  Tile,
} from '@long-game/game-gridlock-definition/v1';
import { TokenHand } from '@long-game/game-ui';
import { TileToken } from '../board/TileToken.js';
import { hooks } from '../gameClient.js';

export interface TileHandProps {}

export const TileHand = hooks.withGame<TileHandProps>(function TileHand({
  gameSuite,
}) {
  const { hand, board } = gameSuite.finalState;
  const { hand: initialHand } = gameSuite.initialState;
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
      className="w-auto min-h-[48px] border-default rounded-sm p-xs bg-white"
    >
      {initialHand.map((tile) => {
        if (!hand.some((t) => t.id === tile.id)) {
          return <div className="w-[48px] h-[48px] bg-wash" key={tile.id} />;
        }
        const unplayable = !hasAnyValidPlacement({
          board,
          tile,
        });
        return (
          <TileToken
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
