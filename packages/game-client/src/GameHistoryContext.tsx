import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

const GameHistoryContext = createContext<{
  roundIndex: number | 'current';
  setRoundIndex: (index: number | 'current') => void;
}>({
  roundIndex: 'current',
  setRoundIndex: () => {},
});

export const GameHistoryProvider = ({ children }: { children?: ReactNode }) => {
  const [roundIndex, innerSetRoundIndex] = useState<number | 'current'>(
    'current',
  );
  const setRoundIndex = useCallback((index: number | 'current') => {
    if (typeof index === 'number' && index < 0) {
      throw new Error('Invalid round index');
    }
    innerSetRoundIndex(index);
  }, []);
  return (
    <GameHistoryContext.Provider value={{ roundIndex, setRoundIndex }}>
      {children}
    </GameHistoryContext.Provider>
  );
};
export function useViewingRoundIndex() {
  const { roundIndex, setRoundIndex } = useContext(GameHistoryContext);
  return [roundIndex, setRoundIndex] as const;
}
