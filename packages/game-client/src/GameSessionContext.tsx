import { GameDefinition } from '@long-game/game-definition';
import { createContext, ReactNode, useContext, useState } from 'react';
import { GameHistoryProvider } from './GameHistoryContext';
import { SdkProvider } from './hooks';
import { GameSessionSdk } from './sdk';

const GameSessionContext = createContext<{
  gameSessionId: string;
  gameDefinition: GameDefinition;
  gameId: string;
} | null>(null);

export const GameSessionProvider = ({
  children,
  ...props
}: {
  gameSessionId: string;
  gameDefinition: GameDefinition;
  children: ReactNode;
  gameId: string;
}) => {
  const [sdk] = useState(() => {
    return new GameSessionSdk(props.gameSessionId, props.gameDefinition);
  });
  return (
    <SdkProvider value={sdk}>
      <GameSessionContext.Provider value={props}>
        <GameHistoryProvider>{children}</GameHistoryProvider>
      </GameSessionContext.Provider>
    </SdkProvider>
  );
};

export const useGameSession = () => {
  const gameSession = useContext(GameSessionContext);
  if (!gameSession) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return gameSession;
};
