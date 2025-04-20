import { Box, Button, toast } from '@a-type/ui';
import type {
  Target,
  CoordinateTarget,
} from '@long-game/game-gudnak-definition/v1';
import { Board } from './Board';
import { Card } from './Card';
import { hooks } from './gameClient';
import { useGameAction } from './useGameAction';
import { Flipper } from 'react-flip-toolkit';
import { useEffect } from 'react';
import { Hand } from './Hand';

export function Client() {
  return (
    <Box>
      <GameState />
    </Box>
  );
}

const GameState = hooks.withGame(function LocalGuess({ gameSuite }) {
  const {
    submitTurn,
    finalState,
    turnError,
    latestRoundIndex,
    gameStatus,
    getPlayer,
  } = gameSuite;
  console.log(JSON.parse(JSON.stringify(finalState)));
  const { hand, board, active, actions, deckCount, freeActions } = finalState;
  const action = useGameAction();

  useEffect(() => {
    if (latestRoundIndex > 0) {
      action.selection.clear();
    }
  }, [latestRoundIndex]);

  useEffect(() => {
    if (turnError) {
      toast.error(turnError);
    }
  }, [turnError]);
  console.log(action.selection.card);

  if (gameStatus.status === 'completed') {
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
    <Box className="w-full h-full flex flex-col p-3 gap-2">
      <Flipper flipKey={JSON.stringify(finalState.board)}>
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
        <Box className="flex flex-row gap-2 items-center mt-5 mb-3">
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
                End turn
              </Button>
            </>
          ) : (
            <span>Waiting on opponent...</span>
          )}
          <span>Actions: {actions}</span>
          <span>Deck count: {deckCount}</span>
          {freeActions.length > 0 && (
            <span>
              Free {freeActions[0].type} action (x {freeActions[0].count ?? 1})
            </span>
          )}
          {action.targeting.next ? (
            <span>{action.targeting.next.description}</span>
          ) : null}
          {/* <span>{turnError}</span> */}
          {/* <span>{JSON.stringify(localTurnData)}</span> */}
        </Box>
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
      </Flipper>
    </Box>
  );
});
export default Client;
