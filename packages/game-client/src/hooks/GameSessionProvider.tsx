import { PrefixedId } from '@long-game/common';
import { GameDefinition } from '@long-game/game-definition';
import { observer } from 'mobx-react-lite';
import {
  ComponentType,
  createContext,
  ReactNode,
  Suspense,
  use,
  useContext,
  useRef,
} from 'react';
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

export function withGame<T = {}, G extends GameDefinition = GameDefinition>(
  Component: ComponentType<T & { gameSuite: GameSessionSuite<G> }>,
): ComponentType<T> {
  const ObservedComp = observer(Component as any);
  return function WithGame(props: T) {
    const gameSuite = useGameSuite<G>();
    // if the suite is loading some state, suspend, so that the wrapped component
    // always has loaded data when rendered.
    const loadingPromise = gameSuite.suspended;
    if (loadingPromise) {
      use(loadingPromise);
    }
    return <ObservedComp {...props} gameSuite={gameSuite} />;
  };
}

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

  // for debugging
  (window as any).gameSuite = cached?.current;

  return (
    <GameSessionContext.Provider value={cached?.current}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
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
  function withGameTyped<T = unknown>(
    Comp: ComponentType<T & { gameSuite: GameSessionSuite<TGame> }>,
  ) {
    return withGame<T, TGame>(Comp);
  }
  return {
    useGameSuite: useGameSuiteTyped,
    withGame: withGameTyped,
  };
}
