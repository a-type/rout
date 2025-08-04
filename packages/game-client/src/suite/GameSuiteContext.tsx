import { GameDefinition } from '@long-game/game-definition';
import { observer } from 'mobx-react-lite';
import { ComponentType, createContext, useContext } from 'react';
import { AbstractGameSuite } from './AbstractGameSuite.js';

export const GameSuiteContext = createContext<AbstractGameSuite<any> | null>(
  null,
);
export const GameSuiteProvider = GameSuiteContext.Provider;

export function withGame<T = {}, G extends GameDefinition = GameDefinition>(
  Component: ComponentType<T & { gameSuite: AbstractGameSuite<G> }>,
): ComponentType<T> {
  const ObservedComp = observer(Component as any);
  return function WithGame(props: T) {
    const gameSuite = useGameSuite<G>();
    return <ObservedComp {...props} gameSuite={gameSuite} />;
  };
}

export function useGameSuite<TGame extends GameDefinition>() {
  const suite = useContext(GameSuiteContext);
  if (!suite) {
    throw new Error('GameSessionProvider not found');
  }
  return suite as AbstractGameSuite<TGame>;
}

export function typedHooks<TGame extends GameDefinition<any>>() {
  function useGameSuiteTyped() {
    return useGameSuite<TGame>();
  }
  function withGameTyped<T = unknown>(
    Comp: ComponentType<T & { gameSuite: AbstractGameSuite<TGame> }>,
  ) {
    return withGame<T, TGame>(Comp);
  }
  return {
    useGameSuite: useGameSuiteTyped,
    withGame: withGameTyped,
  };
}
