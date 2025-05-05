import { Box, Button, toast } from '@a-type/ui';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  cardDefinitions,
  type Coordinate,
  type CoordinateTarget,
} from '@long-game/game-gudnak-definition/v1';
import { DefaultRoundRenderer } from '@long-game/game-ui';
import { useEffect } from 'react';
import { Flipper } from 'react-flip-toolkit';
import { Backdrop } from './Backdrop';
import { Board } from './Board';
import { Card } from './Card';
import { hooks } from './gameClient';
import { Hand } from './Hand';
import { useGameAction } from './useGameAction';
import { useManageCardFlipState } from './useManageCardFlipState';
import { useViewState, ViewStateProvider } from './useViewState';

export function Client() {
  return (
    <ViewStateProvider>
      <Box>
        <GameState />
      </Box>
    </ViewStateProvider>
  );
}

export const Round = DefaultRoundRenderer;

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
    if (turnError) {
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
      distance: 10,
    },
  });
  // const sensors = useSensors(mouseSensor, pointerSensor, touchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  const { viewState, setViewState } = useViewState();

  if (gameStatus.status === 'complete') {
    return (
      <Box className="w-full h-full flex flex-col p-3 gap-2">
        <h3>Game Over</h3>
        <span>
          {getPlayer(gameStatus.winnerIds[0] as `u-${string}`).displayName}{' '}
          wins!
        </span>
      </Box>
    );
  }

  return (
    <Box className="w-full h-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
      <Flipper
        spring="veryGentle"
        flipKey={
          JSON.stringify(finalState.board) +
          JSON.stringify(finalState.playerState)
        }
      >
        <DndContext
          sensors={sensors}
          onDragEnd={(e) => {
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
          <div className="p-3">
            <Hand
              cards={hand}
              selectedId={action.selection.card?.instanceId ?? null}
              onClickCard={(card) => {
                if (!active) {
                  return;
                }
                action.playCard(card);
              }}
            />
            <Box className="flex flex-row gap-2 items-center mt-3">
              {active ? (
                <>
                  <span className="font-bold">It's your turn!</span>
                  <Button
                    disabled={actions <= 0}
                    onClick={() => {
                      submitTurn({ action: { type: 'draw' } });
                    }}
                  >
                    Draw
                  </Button>
                  <Button
                    disabled={actions > 0}
                    onClick={() => {
                      submitTurn({ action: { type: 'endTurn' } });
                    }}
                  >
                    End
                  </Button>
                </>
              ) : (
                <span>Waiting on opponent...</span>
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
            </Box>
          </div>
          <Board
            selection={action.selection.item}
            targets={action.targets}
            state={board}
            onClick={(coord) => {
              if (!active) {
                return;
              }
              if (!action.targeting.next) {
                action.moveCard(coord);
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
          {viewState.kind === 'cardViewer' ? (
            <Backdrop onClick={() => setViewState({ kind: 'game' })} />
          ) : null}

          {viewState.kind === 'cardViewer' ? (
            <div
              // show card over top of game board in the middle of the screen
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-999 max-w-25% overflow-hidden p-4 rounded-2xl shadow-2xl shadow-dark"
              style={{ backgroundColor: 'black' }}
            >
              <Card
                disableTooltip
                noBorder
                info={finalState.cardState[viewState.cardInstanceId]}
                instanceId={viewState.cardInstanceId}
              />
            </div>
          ) : null}
        </DndContext>
      </Flipper>
    </Box>
  );
});
export default Client;
