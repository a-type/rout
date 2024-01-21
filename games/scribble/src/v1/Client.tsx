import { ComponentProps } from 'react';
import { GameClientProvider, useGameClient, withGame } from './gameClient.js';
import { RoundOne } from './components/RoundOne.js';
import { Describe } from './components/Describe.js';
import { Draw } from './components/Draw.js';

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

  if (!client.state) {
    return null;
  }

  // first round, only provide a prompt
  if (client.roundIndex === 0) {
    return <RoundOne />;
  }

  // second round, draw the prompt you get
  if (client.roundIndex === 1) {
    return <Draw />;
  }

  // other rounds - describe then draw
  const hasDescribed = !!client.currentTurn?.data.description;

  // describe first
  if (!hasDescribed) {
    return <Describe />;
  }

  const hasDrawn = !!client.currentTurn?.data.illustration;

  // then draw
  if (!hasDrawn) {
    return <Draw />;
  }

  return <div>Waiting on next round...</div>;
});
