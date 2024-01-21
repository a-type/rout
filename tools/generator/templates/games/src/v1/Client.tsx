import { GameClientProvider, withGame, useGameClient } from './gameClient.js';
import { gameDefinition } from './gameDefinition.js';
import { ComponentProps } from 'react';

export interface ClientProps {
  session: ComponentProps<typeof GameClientProvider>['session'];
}

export function Client({ session }: ClientProps) {
  return (
    <GameClientProvider session={session}>
      <ExampleGameUI />
    </GameClientProvider>
  );
}

export default Client;

// Game UI components must be wrapped in withGame and
// rendered as children of a GameClientProvider.
// You can utilize useGameClient() to get the client,
// then access the client's state properties, which will
// be reactive.
const ExampleGameUI = withGame(function ExampleGameUI() {
  const client = useGameClient();

  return <div>{/* Your game UI goes here */}</div>;
});
