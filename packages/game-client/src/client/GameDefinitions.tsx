import { GameDefinition } from '@long-game/game-definition';
import { createContext, useContext } from 'react';

const GameDefinitionContext = createContext<Record<string, GameDefinition>>({});
export const GameDefinitions = ({
  definitions,
  children,
}: {
  definitions: Record<string, GameDefinition>;
  children: React.ReactNode;
}) => {
  return (
    <GameDefinitionContext.Provider value={definitions}>
      {children}
    </GameDefinitionContext.Provider>
  );
};
export function useGameDefinition(gameId: string) {
  const definitions = useContext(GameDefinitionContext);
  const definition = definitions[gameId];
  if (!definition) {
    throw new Error(`Game definition not found for ${gameId}`);
  }
  return definition;
}
