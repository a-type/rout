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
  const { prepareTurn, isViewingCurrentRound, viewingTurn, finalState } =
    gameSuite;
  const { hand, board } = finalState;
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  return (
    <Box className="w-full h-full mt-10 flex flex-col p-5 gap-2">
      <Box className="flex flex-row gap-2">
        {hand.map((card, index) => (
          <Card
            selected={selectedCard?.instanceId === card.instanceId}
            key={index}
            id={card.cardId as any}
            onClick={() => {
              setSelectedCard(card);
            }}
          />
        ))}
      </Box>
      <Button
        onClick={() => {
          prepareTurn({ action: { type: 'draw' } });
        }}
      >
        Draw
      </Button>
      <Board
        state={board}
        onClick={(coord) => {
          if (selectedCard) {
            prepareTurn({
              action: { type: 'deploy', card: selectedCard, target: coord },
            });
            setSelectedCard(null);
          }
        }}
      />
    </Box>
  );
});
export default Client;
