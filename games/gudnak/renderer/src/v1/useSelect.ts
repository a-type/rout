import { useState } from 'react';
import type {
  Card as CardType,
  Coordinate,
} from '@long-game/game-gudnak-definition/v1';

type Selection = CardType | Coordinate | null;

export function useSelect() {
  const [selection, setSelection] = useState<Selection>(null);

  const isCard = () => {
    return selection && 'instanceId' in selection;
  };

  const isCoordinate = () => {
    return selection && 'x' in selection && 'y' in selection;
  };

  return {
    item: selection,
    set: setSelection,
    clear: () => setSelection(null),
    card: isCard() ? (selection as CardType) : null,
    coordinate: isCoordinate() ? (selection as Coordinate) : null,
  };
}
