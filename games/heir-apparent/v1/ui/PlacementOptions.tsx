import { TokenHand } from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { PlaceableFortressPiece } from './PlaceableFortressPiece.js';

export interface PlacementOptionsProps {
  className?: string;
}

export const PlacementOptions = hooks.withGame<PlacementOptionsProps>(
  function PlacementOptions({ gameSuite, className }) {
    return (
      <TokenHand className={className}>
        {gameSuite.finalState.pieceOptions.map((piece) => (
          <PlaceableFortressPiece key={piece.id} piece={piece} />
        ))}
      </TokenHand>
    );
  },
);
