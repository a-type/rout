import { Box, Button, toast } from '@a-type/ui';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { PrefixedId } from '@long-game/common';
import {
  cardDefinitions,
  type Coordinate,
  type CoordinateTarget,
} from '@long-game/game-gudnak-definition/v1';
import { useEffect } from 'react';
import { Flipper } from 'react-flip-toolkit';
import { CustomChatMessage } from './chat/ChatMessage';
import { useGameAction } from './gameAction/useGameAction';
import { hooks } from './gameClient';
import { useManageCardFlipState } from './useManageCardFlipState';
import { CardViewer } from './views/CardViewer';
import { DiscardViewer } from './views/DiscardViewer';
import { ViewStateProvider } from './views/useViewState';
import { Board } from './zones/Board';
import { Hand } from './zones/Hand';

export function Client() {
  return (
    <ViewStateProvider>
      <GameState />
    </ViewStateProvider>
  );
}

export const ChatMessage = CustomChatMessage;

const GameState = hooks.withGame(function LocalGuess({ gameSuite }) {
  const {
    submitTurn,
    finalState,
    turnError,
    latestRoundIndex,
    gameStatus,
    getPlayer,
    currentTurn,
  } = gameSuite;
  console.log(JSON.parse(JSON.stringify(finalState)));
  const { hand, board, active, actions, freeActions } = finalState;
  const action = useGameAction();
  useManageCardFlipState();

  useEffect(() => {
    if (latestRoundIndex > 0) {
      action.selection.clear();
    }
  }, [latestRoundIndex]);

  useEffect(() => {
    // TODO: Prevent from showing same error multiple times
    if (turnError && currentTurn) {
      toast.error(turnError);
    }
  }, [turnError, currentTurn]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      distance: 20,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  if (gameStatus.status === 'complete') {
    return (
      <Box className="w-full h-full flex flex-col p-3 gap-2">
        <h3>Game Over</h3>
        <span>
          {getPlayer(gameStatus.winnerIds[0] as PrefixedId<'u'>).displayName}{' '}
          wins!
        </span>
      </Box>
    );
  }

  return (
    <Box
      className="w-full h-full flex flex-col gap-2 overflow-y-hidden overflow-x-hidden"
      data-id="main-game-area"
    >
      <Flipper
        spring="veryGentle"
        flipKey={
          JSON.stringify(finalState.board) +
          JSON.stringify(finalState.playerState)
        }
      >
        <DndContext
          modifiers={[restrictToWindowEdges]}
          sensors={sensors}
          onDragEnd={(e) => {
            if (e.over?.id === 'hand') {
              return;
            }
            const coord = e.over?.data.current?.coordinate as Coordinate;
            const cardInstanceId = e.active.data.current?.instanceId;
            const card = finalState.cardState[cardInstanceId as string];
            const kind = cardDefinitions[card.cardId]?.kind;
            if (!kind) {
              console.error(
                'No kind',
                cardInstanceId,
                finalState.cardState[cardInstanceId as string],
              );
              return;
            }
            if ((kind === 'fighter' && !coord) || !cardInstanceId) {
              console.error('No coord or cardInstanceId');
              return;
            }
            if (kind === 'tactic') {
              action.playCard(card);
              return;
            }
            action.deployOrPlayCardImmediate(cardInstanceId, coord);
          }}
        >
          {active ? (
            <div className="px-4 py-2 absolute top-0 left-0 right-0 z-50 bg-dark-9/80 shadow-lg shadow-dark">
              <Box className="flex flex-row gap-2 items-center">
                <>
                  <span className="font-bold">Your turn!</span>
                  <Button
                    size="small"
                    disabled={actions <= 0}
                    onClick={() => {
                      submitTurn({ data: { action: { type: 'draw' } } });
                    }}
                  >
                    Draw
                  </Button>
                  <Button
                    size="small"
                    disabled={actions <= 0}
                    onClick={() => {
                      action.defend();
                    }}
                  >
                    Defend
                  </Button>
                  {actions === 0 && (
                    <Button
                      size="small"
                      disabled={actions > 0}
                      onClick={() => {
                        submitTurn({ data: { action: { type: 'endTurn' } } });
                      }}
                    >
                      End
                    </Button>
                  )}
                  <span>Actions: {actions}</span>

                  {freeActions.length > 0 && (
                    <span>
                      Free {freeActions[0].type} action (x{' '}
                      {freeActions[0].count ?? 1})
                    </span>
                  )}
                  {action.targeting.next ? (
                    <span>{action.targeting.next.description}</span>
                  ) : null}
                </>
              </Box>
            </div>
          ) : null}
          <Board
            selection={action.selection.item}
            targets={action.targets}
            state={board}
            onClick={(coord) => {
              if (!active) {
                return;
              }
              if (!action.targeting.next) {
                action.moveOrAttackCard(coord);
                return;
              }
              if (action.targeting.next.type === 'coordinate') {
                const target: CoordinateTarget = {
                  kind: 'coordinate',
                  x: coord.x,
                  y: coord.y,
                };

                action.targeting.select(target);
                return;
              } else if (action.targeting.next.type === 'card') {
                const stack = board[coord.y][coord.x];
                const cardInstanceId = stack[stack.length - 1];
                if (cardInstanceId) {
                  action.targeting.select({
                    kind: 'card',
                    instanceId: cardInstanceId,
                  });
                }
              }
            }}
            onClickCard={(card, coord) => {
              if (!active) {
                return;
              }
              if (!action.targeting.next) {
                action.activateAbility(card, coord);
                return;
              }
              if (action.targeting.next.type === 'card') {
                action.targeting.select({
                  kind: 'card',
                  instanceId: card.instanceId,
                });
                return;
              } else if (action.targeting.next.type === 'coordinate') {
                action.targeting.select({
                  kind: 'coordinate',
                  x: coord.x,
                  y: coord.y,
                });
              }
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Hand
              cards={hand}
              selectedId={action.selection.card?.instanceId ?? null}
              targets={action.targets}
              onClickCard={(card) => {
                if (!active) {
                  return;
                }
                if (action.targeting.active) {
                  action.targeting.select({
                    kind: 'card',
                    instanceId: card.instanceId,
                  });
                  return;
                }
              }}
            />
          </div>
          <DiscardViewer />
          <CardViewer />
        </DndContext>
      </Flipper>
    </Box>
  );
});
export default Client;
