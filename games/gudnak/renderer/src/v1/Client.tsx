import { Box, Button } from '@a-type/ui';
import { hooks } from './gameClient';
import { Card } from './Card';
import { Board } from './Board';
import { useState } from 'react';
import { type Card as CardType } from '@long-game/game-gudnak-definition/v1';

export function Client() {
  return (
    <Box>
      <GameState />
    </Box>
  );
}

const GameState = hooks.withGame(function LocalGuess({ gameSuite }) {
  const { prepareTurn, finalState, turnError } = gameSuite;
  const { hand, board, active, actions, deckCount } = finalState;
  console.log(JSON.parse(JSON.stringify(finalState)));
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <Box className="w-full h-full mt-10 flex flex-col p-5 gap-2">
      <Box className="flex flex-row gap-2">
        {hand.map((card, index) => (
          <Card
            selected={selectedCard?.instanceId === card.instanceId}
            key={index}
            info={card}
            onClick={() => {
              setSelectedCard(card);
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
        <span>{turnError}</span>
      </Box>
      <Board
        selectedSpace={selectedSpace}
        state={board}
        onClick={(coord) => {
          if (selectedCard) {
            prepareTurn({
              action: { type: 'deploy', card: selectedCard, target: coord },
            });
            setSelectedCard(null);
            setSelectedSpace(null);
          } else if (selectedSpace) {
            const stack = board[selectedSpace.y][selectedSpace.x];
            if (!stack) return;
            const topCard = stack[stack.length - 1];
            prepareTurn({
              action: {
                type: 'move',
                cardInstanceId: topCard,
                source: selectedSpace,
                target: coord,
              },
            });
            setSelectedSpace(null);
          } else {
            setSelectedSpace(coord);
          }
        }}
      />
    </Box>
  );
});
export default Client;
