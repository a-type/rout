import { Coordinate } from '@long-game/game-gudnak-definition/v1';
import { create } from 'zustand';

type Store = {
  highlightedCoordinate: Coordinate | null;
  setHighlightedCoordinate: (coordinate: Coordinate | null) => void;
  clearHighlightedCoordinate: () => void;
};

const useStore = create<Store>((set) => ({
  highlightedCoordinate: null,
  kind: null,
  setHighlightedCoordinate: (coordinate) => {
    set(() => ({
      highlightedCoordinate: coordinate,
    }));
  },
  clearHighlightedCoordinate: () => {
    set(() => ({
      highlightedCoordinate: null,
      kind: null,
    }));
  },
}));

export const useHighlightSpace = () => {
  return useStore();
};
