import { useState } from 'react';
import type {
  Card as CardType,
  Coordinate,
} from '@long-game/game-gudnak-definition/v1';

export type Selection = CardType | Coordinate | null;

export const isCard = (s: Selection): s is CardType => {
  return !!s && 'instanceId' in s;
};

export const isCoordinate = (s: Selection): s is Coordinate => {
  return !!s && 'x' in s && 'y' in s;
};

export function useSelect() {
  const [selection, setSelection] = useState<Selection>(null);

  return {
    item: selection,
    set: setSelection,
    clear: () => setSelection(null),
    card: isCard(selection) ? selection : null,
    coordinate: isCoordinate(selection) ? selection : null,
  };
}
