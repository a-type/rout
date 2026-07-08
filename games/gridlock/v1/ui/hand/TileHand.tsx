import { TokenHand } from '@long-game/game-ui';
import { hasAnyValidPlacement, Tile } from '../../definition/index';
import { TileToken } from '../board/TileToken.js';
import { hooks } from '../gameClient.js';
import cls from './TileHand.module.css';

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
            placements: cur.placements.filter((p) => p.tileId !== tile.data.id),
          };
        });
      }}
      className={cls.root}
    >
      {initialHand.map((tile) => {
        if (!hand.some((t) => t.id === tile.id)) {
          return <div className={cls.blank} key={tile.id} />;
        }
        const unplayable = !hasAnyValidPlacement({
          board,
          tile,
        });
        return (
          <TileToken
            key={tile.id}
            tile={tile}
            className={cls.tile}
            unplayable={unplayable}
            inHand
            playerId={gameSuite.playerId}
          />
        );
      })}
    </TokenHand>
  );
});
