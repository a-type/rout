import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import { hooks } from '../gameClient';

import { clsx, Tooltip } from '@a-type/ui';
import {
  canAssignToPosition,
  isPitcher,
  Position,
  PositionChart,
} from '@long-game/game-wizard-ball-definition';
import { PlayerClass } from '../players/PlayerClass';
import { PlayerSpecies } from '../players/PlayerSpecies';
import { PlayerStatus } from '../players/PlayerStatus';
import { PlayerTooltipContent } from '../players/PlayerTooltipContent';
import { PlayerOverall } from '../ratings/PlayerOverall';
import { PlayerStamina } from '../ratings/PlayerStamina';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';

const positions = [
  'c',
  '1b',
  '2b',
  'ss',
  '3b',
  'lf',
  'cf',
  'rf',
  'dh',
] as const satisfies Position[];

export function TeamChart({ id }: { id: string }) {
  const {
    finalState,
    prepareTurn,
    playerId: currentUserId,
  } = hooks.useGameSuite();
  const team = finalState.league.teamLookup[id];
  const [depthChart, setDepthChart] = useState<PositionChart>(
    team?.positionChart,
  );
  const [pitchingOrder, setPitchingOrder] = useState(team?.pitchingOrder);
  useEffect(() => {
    if (currentUserId !== team.ownerId) {
      return;
    }
    prepareTurn((current) => ({
      ...current,
      nextPositionChart: depthChart,
    }));
  }, [depthChart]);

  useEffect(() => {
    if (currentUserId !== team.ownerId) {
      return;
    }
    prepareTurn((current) => ({
      ...current,
      nextPitchingOrder: pitchingOrder,
    }));
  }, [pitchingOrder]);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  function handleDepthChartDragEnd(event: DragEndEvent) {
    if (event.over && event.over.id) {
      const isBench = event.over.id === 'bench';
      const playerId = event.active.id as string;
      const currentPosition = Object.entries(depthChart).find(
        ([, id]) => id === playerId,
      )?.[0];
      if (isBench) {
        if (!currentPosition) {
          return;
        }
        setDepthChart((current) => ({
          ...current,
          [currentPosition]: null,
        }));

        return;
      }

      const [, position] = (event.over.id as string).split('-');
      if (!position || position === currentPosition) {
        return;
      }

      setDepthChart((current) => {
        const nextPositionChart = {
          ...current,
          [position]: playerId,
        };
        if (currentPosition) {
          nextPositionChart[currentPosition as keyof PositionChart] = null;
        }
        return nextPositionChart;
      });
    }
  }

  function handlePitchingOrderDragEnd(event: DragEndEvent) {
    if (!event.over || !event.over.id) {
      return;
    }
    const playerId = event.active.id as string;
    if (event.over.id.toString().startsWith('pitcher')) {
      const [, index] = (event.over.id as string).split('-');
      if (!index) {
        return;
      }
      const currentPitchingIndex = pitchingOrder.findIndex(
        (p) => p === playerId,
      );
      const pitcherIndex = parseInt(index, 10);
      if (currentPitchingIndex === pitcherIndex) {
        return;
      }
      setPitchingOrder((current) => {
        const nextOrder = arrayMove(
          current,
          currentPitchingIndex,
          pitcherIndex,
        );
        return nextOrder;
      });

      return;
    }
  }

  return (
    <div className="flex flex-col">
      <h2>Depth Chart</h2>
      <DndContext
        onDragEnd={handleDepthChartDragEnd}
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex flex-col gap-1">
          {positions.map((position, idx) => {
            const playerId = depthChart[position];
            const player = playerId
              ? finalState.league.playerLookup[playerId]
              : null;
            return (
              <Droppable
                key={idx}
                className="flex flex-row items-center gap-2"
                id={`position-${position}`}
              >
                <span className="uppercase">{position}</span>
                {player ? (
                  <>
                    <Draggable
                      disabled={currentUserId !== team.ownerId}
                      id={player.id}
                      className={clsx(
                        canAssignToPosition(player.positions, position)
                          ? 'bg-gray-wash'
                          : 'bg-attention-dark',
                        'border-light p-1 rounded flex items-center gap-2 cursor-pointer hover:bg-gray',
                      )}
                    >
                      <Tooltip
                        className="bg-gray-wash color-gray-ink"
                        content={<PlayerTooltipContent id={player.id} />}
                      >
                        <span className="flex items-center gap-1">
                          <PlayerStatus id={player.id} />
                          {player.name}
                          <PlayerSpecies id={player.id} />
                          <PlayerClass id={player.id} />
                        </span>
                      </Tooltip>
                      <span className="uppercase">
                        {player.positions.join('/')}
                      </span>
                    </Draggable>
                    <PlayerOverall id={player.id} />
                    <PlayerStamina id={player.id} />
                  </>
                ) : (
                  <span className="color-gray-dark p-1">Empty</span>
                )}
              </Droppable>
            );
          })}
        </div>
        <hr className="w-full h-1 bg-gray-wash my-4 border-none" />
        <h4 className="mt-0 mb-2">Bench</h4>
        <Droppable id="bench" className="flex flex-col gap-1">
          {team.playerIds
            .filter((p) => !Object.values(depthChart).includes(p))
            .filter((p) =>
              finalState.league.playerLookup[p].positions.every(
                (p) => !isPitcher(p),
              ),
            )
            .map((playerId) => {
              const player = finalState.league.playerLookup[playerId];
              return (
                <div key={playerId} className="flex items-center gap-2">
                  <Draggable
                    disabled={currentUserId !== team.ownerId}
                    id={playerId}
                    className="bg-gray-wash border-light p-1 rounded shadow-sm mb-1 flex items-center gap-2 cursor-pointer hover:bg-gray"
                  >
                    <span className="uppercase">
                      {player.positions.join('/')}
                    </span>
                    <Tooltip
                      className="bg-gray-wash color-gray-ink"
                      content={<PlayerTooltipContent id={player.id} />}
                    >
                      <span className="flex items-center gap-1">
                        <PlayerStatus id={player.id} />
                        {player.name}
                      </span>
                    </Tooltip>
                  </Draggable>
                  <PlayerOverall id={player.id} />
                  <PlayerStamina id={player.id} />
                </div>
              );
            })}
        </Droppable>
      </DndContext>
      <hr className="w-full h-1 bg-gray-wash my-4 border-none" />
      <h4 className="mt-0 mb-2">Pitching rotation</h4>
      <DndContext
        onDragEnd={handlePitchingOrderDragEnd}
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex flex-col gap-1">
          {pitchingOrder.map((playerId, idx) => {
            const player = finalState.league.playerLookup[playerId];
            return (
              <Droppable key={idx} id={`pitcher-${idx}`}>
                <div
                  className={clsx(
                    team.nextPitcherIndex === idx ? 'text-yellow-500' : '',
                    'flex items-center gap-2',
                  )}
                >
                  <span>{idx + 1}</span>
                  <Draggable
                    disabled={currentUserId !== team.ownerId}
                    id={playerId}
                    className="bg-gray-wash border-light p-1 rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray"
                  >
                    <span className="uppercase">
                      {player.positions.join('/')}
                    </span>
                    <Tooltip
                      className="bg-gray-wash color-gray-ink"
                      content={<PlayerTooltipContent id={player.id} />}
                    >
                      <span className="flex items-center gap-1">
                        <PlayerStatus id={player.id} />
                        {player.name}
                      </span>
                    </Tooltip>
                  </Draggable>
                  <PlayerOverall id={player.id} />
                  <PlayerStamina id={player.id} />
                </div>
              </Droppable>
            );
          })}
        </div>
        <hr className="w-full h-1 bg-gray-wash my-4 border-none" />
        <h4 className="mt-0 mb-2">Relievers</h4>
        <Droppable id="relievers" className="flex flex-col gap-1">
          {team.playerIds
            .filter((p) => !pitchingOrder.includes(p))
            .filter((p) =>
              finalState.league.playerLookup[p].positions.some((p) =>
                isPitcher(p),
              ),
            )
            .map((playerId) => {
              const player = finalState.league.playerLookup[playerId];
              return (
                <div key={playerId} className="flex items-center gap-2">
                  <Draggable
                    disabled={currentUserId !== team.ownerId}
                    id={playerId}
                    className="bg-gray-wash border-light p-1 rounded shadow-sm mb-1 flex items-center gap-2 cursor-pointer hover:bg-gray"
                  >
                    <span className="uppercase">
                      {player.positions.join('/')}
                    </span>
                    <Tooltip
                      className="bg-gray-wash color-gray-ink"
                      content={<PlayerTooltipContent id={player.id} />}
                    >
                      <span className="flex items-center gap-1">
                        <PlayerStatus id={player.id} />
                        {player.name}
                      </span>
                    </Tooltip>
                  </Draggable>
                  <PlayerOverall id={player.id} />
                  <PlayerStamina id={player.id} />
                </div>
              );
            })}
        </Droppable>
      </DndContext>
    </div>
  );
}
