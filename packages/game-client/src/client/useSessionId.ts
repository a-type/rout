import { createContext, useContext } from 'react';

const GameSessionContext = createContext<string | null>(null);

export function useGameSessionId() {
  const sessionId = useContext(GameSessionContext);
  if (!sessionId) {
    throw new Error('GameSessionContext not found');
  }
  return sessionId;
}

export const GameSessionProvider = GameSessionContext.Provider;
