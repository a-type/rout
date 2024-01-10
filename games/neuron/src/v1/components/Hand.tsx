import { useGameClient, withGame } from '../gameClient.js';
import { PlayerHand } from '../gameDefinition.js';
import { DraggableTile, EmptyTile, Tile } from './Tile.js';

export interface HandProps {
  data: PlayerHand;
}

export const Hand = withGame(function Hand({ data }: HandProps) {
  const { tiles } = data;
  return (
    <div className="flex flex-row gap-2 justify-around w-[288px]">
      {tiles.map((t, idx) =>
        t ? (
          <DraggableTile id={t.id} key={t.id} cells={[t]} />
        ) : (
          <EmptyTile key={idx} />
        ),
      )}
    </div>
  );
});
