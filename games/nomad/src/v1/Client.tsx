import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';
import { ComponentProps } from 'react';
import Blessings from './components/Blessings.js';
import TerrainGrid from './components/TerrainGrid.js';

const { GameClientProvider, useGameClient, withGame } =
  createGameClient(gameDefinition);

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

  return ( 
  <div>
    <h1>Nomad</h1>
    {client.error && <div>{client.error}</div>}
    <div>
      Players: {client.session.members.map((member) => (
        <span key={member.id}>
          {member.name}
        </span>
      ))}
    </div>
    {client.state && <>
      <Blessings items={client.state.flippedBlessings} />
      <TerrainGrid items={client.state.terrainGrid} playerLocation={client.state.position} />
    </>}
  </div>
  );
});
