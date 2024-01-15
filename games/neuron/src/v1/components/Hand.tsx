import { useGameClient, withGame } from '../gameClient.js';
import { GridTile, PlayerHand, canTileBePlayed } from '../gameDefinition.js';
import { DraggableTile, EmptyTile, Tile } from './Tile.js';

export interface HandProps {
  data: PlayerHand;
}

export const Hand = withGame(function Hand({ data }: HandProps) {
  const { tiles } = data;
  return (
    <div className="flex flex-row gap-2 justify-around w-full mx-4">
      {tiles.map((t, idx) => (
        <div
          key={t?.id ?? idx}
          className="aspect-square border-1 border-solid border-black"
        >
          {t ? <HandTile tile={t} /> : <EmptyTile />}
        </div>
      ))}
    </div>
  );
});

const HandTile = withGame(function HandTile({ tile }: { tile: GridTile }) {
  const client = useGameClient();
  const grid = client.state?.grid;
  const canBePlayed = canTileBePlayed(tile.shape, grid ?? {});

  return (
    <DraggableTile
      id={tile.id}
      cells={[tile]}
      className={canBePlayed ? '' : 'opacity-50 bg-white'}
    />
  );
});
