import { createGameClient } from '@long-game/game-client';
import { CoordinateKey, gameDefinition } from './gameDefinition.js';
import { ComponentProps, useEffect, useState } from 'react';
import Blessings from './components/Blessings.js';
import TerrainGrid from './components/TerrainGrid.js';
import { axialDistance, last, offsetToAxial, sum } from './utils.js';
import { movementCosts } from './components/terrain.js';
import TileInfo from './components/TileInfo.js';
import Inventory from './components/Inventory.js';
import { BasicGameLog } from '@long-game/game-ui';

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
  const [hoveredCoordinate, setHoveredCoordinate] =
    useState<CoordinateKey | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      location.reload();
    }, 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  });

  const lastMovePosition = client.currentTurn
    ? last(client.currentTurn.data.positions)
    : undefined;

  if (!client.state) {
    return <div>Loading...</div>;
  }

  const remainingMovement = Math.max(
    0,
    client.state.movement -
      sum(
        (client.currentTurn?.data.positions ?? [])
          .map((position) => client.state?.terrainGrid[position].type)
          .map((terrainType) => movementCosts[terrainType!]),
      ),
  );

  return (
    <div className="flex flex-row gap-1">
      <div className="flex-grow-1">
        {client.error && <div>{client.error}</div>}
        <div>
          Players:{' '}
          {client.session.members.map((member) => (
            <span key={member.id}>{member.name}</span>
          ))}
        </div>
        <hr />
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-3">
            <Blessings items={client.state.flippedBlessings} />
            Remaining: {client.state.remainingBlessingCount}
          </div>
          <hr style={{ width: '100%' }} />
          <div className="flex flex-row gap-6">
            <TerrainGrid
              items={client.state.terrainGrid}
              playerLocation={client.state.position}
              playerColor={client.state.color}
              movePath={client.currentTurn?.data.positions}
              onTerrainHover={(x, y) => {
                if (!client.state) {
                  return;
                }
                const [q, r] = offsetToAxial([x, y]);
                setHoveredCoordinate(`${q},${r}`);
              }}
              onClick={(x, y) => {
                if (!client.state) {
                  return;
                }
                const [q, r] = offsetToAxial([x, y]);
                if (
                  axialDistance(
                    lastMovePosition ?? client.state.position,
                    `${q},${r}`,
                  ) === 1 &&
                  remainingMovement > 0
                ) {
                  client.prepareTurn({
                    positions: [
                      ...(client.currentTurn?.data?.positions ?? []),
                      `${q},${r}`,
                    ],
                  });
                }
              }}
            />
            {hoveredCoordinate && (
              <div
                className="border-l border-l-solid px-4"
                style={{ borderColor: 'white' }}
              >
                <TileInfo item={client.state.terrainGrid[hoveredCoordinate]} />
              </div>
            )}
          </div>
        </div>
        <hr />
        <div>Remaining movement: {remainingMovement}</div>
        {client.currentTurn?.data.positions.map((position, idx) => (
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
          {/* <button
          onClick={() => client.clearMoves()}
          disabled={client.queuedMoves.length === 0}
        >
          Clear
        </button> */}
          <button
            onClick={() => {
              // TODO: handle error (typically when the move has been processed but the client hasn't reloaded.
              client.submitMoves();
            }}
            disabled={!client.dirty}
          >
            Submit
          </button>
        </div>
        <div className="flex flex-row gap-8">
          <div>
            <h3>Inventory</h3>
            <Inventory items={client.state.inventory || []} />
          </div>
          <div>
            <h3>Acquired blessings</h3>
            <Blessings items={client.state.acquiredBlessings || []} />
          </div>
        </div>
      </div>
      <div className="h-full border-l border-l-solid px-4 py-5 flex-grow-0">
        <BasicGameLog />
      </div>
    </div>
  );
});
