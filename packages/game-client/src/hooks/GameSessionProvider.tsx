import { PrefixedId } from '@long-game/common';
import { GameDefinition } from '@long-game/game-definition';
import { useSuspenseQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import {
  ComponentType,
  createContext,
  ReactNode,
  Suspense,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSdk } from '../hooks.jsx';
import { PublicSdk } from '../sdk/PublicSdk.js';
import { GameSessionSuite } from '../state/gameSessionMobx.js';
import { connectToSocket } from '../state/socket.js';

export const GameSessionContext = createContext<GameSessionSuite<any> | null>(
  null,
);

export function withGame<T = {}, G extends GameDefinition = GameDefinition>(
  Component: ComponentType<T & { gameSuite: GameSessionSuite<G> }>,
): ComponentType<T> {
  const ObservedComp = observer(Component as any);
  return function WithGame(props: T) {
    const gameSuite = useGameSuite<G>();
    return <ObservedComp {...props} gameSuite={gameSuite} />;
  };
}

export function GameSessionProvider({
  gameSessionId,
  gameDefinition,
  children,
  fallback,
}: {
  gameSessionId: PrefixedId<'gs'>;
  gameDefinition: GameDefinition;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const sdk = useSdk() as PublicSdk;
  const { data: details } = useSuspenseQuery(
    sdk.getGameSessionDetails({ id: gameSessionId }),
  );

  const [gameSuite, setGameSuite] = useState(
    () =>
      new GameSessionSuite(
        { ...details, gameDefinition },
        { socket: connectToSocket(details.id) },
      ),
  );
  if (gameSuite.gameSessionId !== gameSessionId) {
    gameSuite.dispose();
    setGameSuite(
      new GameSessionSuite(
        { ...details, gameDefinition },
        {
          socket: connectToSocket(details.id),
        },
      ),
    );
  }
  useEffect(() => gameSuite.connect(), [gameSuite]);
  // for debugging
  (window as any).gameSuite = gameSuite;

  // submit turn on dismount
  useEffect(
    () => () => {
      if (gameSuite.isTurnSubmitDelayed) {
        gameSuite.submitTurn();
      }
    },
    [gameSuite],
  );

  return (
    <GameSessionContext.Provider value={gameSuite}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </GameSessionContext.Provider>
  );
}

export function useGameSuite<TGame extends GameDefinition>() {
  const suite = useContext(GameSessionContext);
  if (!suite) {
    throw new Error('GameSessionProvider not found');
  }
  return suite as GameSessionSuite<TGame>;
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

export function typedHooks<
  TGame extends GameDefinition<any, any, any, any, any, any>,
>() {
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
