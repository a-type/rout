import { PrefixedId } from '@long-game/common';
import { GameDefinition } from '@long-game/game-definition';
import { observer } from 'mobx-react-lite';
import { createContext, ReactNode, use, useContext, useRef } from 'react';
import {
  createGameSessionSuite,
  GameSessionSuite,
} from '../state/gameSessionMobx';

export const GameSessionContext = createContext<GameSessionSuite<any> | null>(
  null,
);

class PromiseWithCurrent<T> {
  promise: Promise<T>;
  current: T | null = null;

  constructor(promise: Promise<T>) {
    this.promise = promise;
    promise.then((result) => {
      this.current = result;
    });
  }
}

const stateCache: Map<PrefixedId<'gs'>, PromiseWithCurrent<any>> = new Map();

export const withGame = observer;

export function GameSessionProvider({
  gameSessionId,
  children,
}: {
  gameSessionId: PrefixedId<'gs'>;
  children: ReactNode;
}) {
  const cached = stateCache.get(gameSessionId);
  if (!cached?.current) {
    if (cached) {
      use(cached.promise);
    } else {
      const promise = createGameSessionSuite(gameSessionId);
      stateCache.set(gameSessionId, new PromiseWithCurrent(promise));
      use(promise);
    }
  }

  return (
    <GameSessionContext.Provider value={cached?.current}>
      {children}
    </GameSessionContext.Provider>
  );
}

export function useGameSuite<TGame extends GameDefinition>() {
  const suite = useRef(useContext(GameSessionContext));
  if (!suite.current) {
    throw new Error('GameSessionProvider not found');
  }
  return suite.current as GameSessionSuite<TGame>;
}

export function useChat() {
  const suite = useGameSuite();
  const messages = suite.chat;

  return {
    messages,
    send: suite.sendChat,
    loadMore: suite.loadMoreChat,
  };
}

export function typedHooks<TGame extends GameDefinition>() {
  function useGameSuiteTyped() {
    return useGameSuite<TGame>();
  }
  function usePlayerState() {
    const suite = useGameSuite<TGame>();
    return suite.playerState;
  }
  return {
    useGameSuite: useGameSuiteTyped,
    usePlayerState,
  };
}
