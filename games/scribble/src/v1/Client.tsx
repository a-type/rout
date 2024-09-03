import { ComponentProps } from 'react';
import { GameClientProvider, useGameClient, withGame } from './gameClient.js';

export interface ClientProps {
  session: ComponentProps<typeof GameClientProvider>['session'];
}

export function Client({ session }: ClientProps) {
  return (
    <GameClientProvider session={session}>
      <GameUI />
    </GameClientProvider>
  );
}

export default Client;

const GameUI = withGame(function ExampleGameUI() {
  const client = useGameClient();

  return <div>Waiting on next round...</div>;
});
