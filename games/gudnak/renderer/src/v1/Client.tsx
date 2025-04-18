import { Box, Button } from '@a-type/ui';
import { type CoordinateTarget } from '@long-game/game-gudnak-definition/v1';
import { Board } from './Board';
import { Card } from './Card';
import { hooks } from './gameClient';
import { useGameAction } from './useGameAction';

export function Client() {
  return (
    <Box>
      <GameState />
    </Box>
  );
}

const GameState = hooks.withGame(function LocalGuess({ gameSuite }) {
  const { prepareTurn, finalState, turnError, localTurnData } = gameSuite;
  const { hand, board, active, actions, deckCount, freeActions } = finalState;
  const action = useGameAction();

  return (
    <Box className="w-full h-full mt-10 flex flex-col p-5 gap-2">
      <Box className="flex flex-row gap-2">
        {hand.map((card, index) => (
          <Card
            selected={action.selection.card?.instanceId === card.instanceId}
            key={index}
            info={card}
            onClick={() => {
              action.playCard(card);
            }}
          />
        ))}
      </Box>
      <Box className="flex flex-row gap-2 items-center my-3">
        {active ? (
          <>
            <span className="font-bold">It's your turn!</span>
            <Button
              disabled={actions <= 0}
              onClick={() => {
                prepareTurn({ action: { type: 'draw' } });
              }}
            >
              Draw
            </Button>
            <Button
              disabled={actions > 0}
              onClick={() => {
                prepareTurn({ action: { type: 'endTurn' } });
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
        <span>{turnError}</span>
        <span>{JSON.stringify(localTurnData)}</span>
      </Box>
      <Board
        selectedSpace={action.selection.coordinate}
        state={board}
        onClick={(coord) => {
          if (
            action.targeting.next &&
            action.targeting.next.type === 'coordinate'
          ) {
            const target: CoordinateTarget = {
              kind: 'coordinate',
              x: coord.x,
              y: coord.y,
            };

            action.targeting.select(target);
            return;
          }

          action.moveCard(coord);
        }}
        onClickCard={(card) => {
          if (action.targeting.next && action.targeting.next.type === 'card') {
            action.targeting.select({
              kind: 'card',
              instanceId: card.instanceId,
            });
            return;
          }
          action.activateAbility(card);
        }}
      />
    </Box>
  );
});
export default Client;
