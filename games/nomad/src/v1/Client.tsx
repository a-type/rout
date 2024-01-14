import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';
import { ComponentProps, useEffect } from 'react';
import Blessings from './components/Blessings.js';
import TerrainGrid from './components/TerrainGrid.js';
import { axialDistance, last, offsetToAxial } from './utils.js';

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
  const lastMovePosition = last(client.queuedMoves?.[0]?.data.positions);

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
      <hr />
      {client.state && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-3">
            <Blessings items={client.state.flippedBlessings} />
            Remaining: {client.state.remainingBlessingCount}
          </div>
          <hr style={{ width: '100%' }} />
          <TerrainGrid
            items={client.state.terrainGrid}
            playerLocation={client.state.position}
            playerColor={client.state.color}
            movePath={client.queuedMoves.flatMap((move) => move.data.positions)}
            onClick={(x, y) => {
              if (!client.state) {
                return;
              }
              const [q, r] = offsetToAxial([x, y]);
              if (
                axialDistance(
                  lastMovePosition ?? client.state.position,
                  `${q},${r}`,
                ) === 1
              ) {
                client.setMove(0, {
                  positions: [
                    ...(client.queuedMoves?.[0]?.data?.positions ?? []),
                    `${q},${r}`,
                  ],
                });
              }
            }}
          />
        </div>
      )}
      <hr />
      {client.state &&
        client.queuedMoves?.[0]?.data.positions.map((position, idx) => (
          <div className="flex flex-row gap-2" key={idx}>
            <span>{position}</span>
            <span>{client.state!.terrainGrid[position].type}</span>
            {client.state!.terrainGrid[position].features.map(
              (feature, idx) => (
                <span key={idx}>{feature}</span>
              ),
            )}
          </div>
        ))}
      <div className="flex flex-row gap-2">
        <button
          onClick={() => client.clearMoves()}
          disabled={client.queuedMoves.length === 0}
        >
          Clear
        </button>
        <button
          onClick={() => client.submitMoves()}
          disabled={!hasUnsubmittedMoves}
        >
          Submit
        </button>
      </div>
      <h3>Acquired blessings</h3>
      <Blessings items={client.state?.acquiredBlessings || []} />
    </div>
  );
});
