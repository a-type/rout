import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';
import { ComponentProps, useEffect } from 'react';
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
  const hasUnsubmittedMoves =
    client.queuedMoves.filter((move) => !move.createdAt).length > 0;
  useEffect(() => {
    const interval = setInterval(() => {
      location.reload();
    }, 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  });

  return (
    <div>
      <h1>Nomad</h1>
      {client.error && <div>{client.error}</div>}
      <div>
        Players:{' '}
        {client.session.members.map((member) => (
          <span key={member.id}>{member.name}</span>
        ))}
      </div>
      {client.state && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-3">
            <Blessings items={client.state.flippedBlessings} />
            Remaining: {client.state.remainingBlessingCount}
          </div>
          <TerrainGrid
            items={client.state.terrainGrid}
            playerLocation={client.state.position}
            targetLocation={
              client.queuedMoves.length > 0
                ? client.queuedMoves[0].data.position
                : undefined
            }
            onClick={(x, y) => {
              client.setMove(0, { position: `${x},${y}` });
            }}
          />
        </div>
      )}
      {client.queuedMoves.map((move, idx) => (
        <div key={idx}>{move.data.position}</div>
      ))}
      <button
        onClick={() => client.submitMoves()}
        disabled={!hasUnsubmittedMoves}
      >
        Submit
      </button>
      <h3>Acquired blessings</h3>
      <Blessings
        items={
          client.state?.acquiredBlessings[client.session.localPlayer.id] || []
        }
      />
    </div>
  );
});
