import { GameDefinition, GameModule } from '@long-game/game-definition';
import { createContext, useContext } from 'react';

const GameDefinitionContext = createContext<Record<string, GameModule>>({});
export const GameDefinitions = ({
  definitions,
  children,
}: {
  definitions: Record<string, GameModule>;
  children: React.ReactNode;
}) => {
  return (
    <GameDefinitionContext.Provider value={definitions}>
      {children}
    </GameDefinitionContext.Provider>
  );
};
export function useGameDefinition(
  gameId: string,
  version: string,
): GameDefinition {
  const definitions = useContext(GameDefinitionContext);
  const definition = definitions[gameId];
  if (!definition) {
    throw new Error(`Game definition not found for ${gameId}`);
  }
  const versionDef = definition.versions.find((v) => v.version === version);
  if (!versionDef) {
    throw new Error(`Game version not found for ${gameId} ${version}`);
  }
  return versionDef;
}
