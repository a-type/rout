import { Box, Button } from '@a-type/ui';
import { hooks } from './gameClient';
import { Card } from './Card';
import { Board } from './Board';
import { useState } from 'react';
import { type Card as CardType } from '@long-game/game-gudnak-definition/v1';
import { cardDefinitions } from '@long-game/game-gudnak-definition';
import type { ValidCardId } from '../../../definition/src/v1/cardDefinition';
import {
  abilityDefinitions,
  type EffectTargetDefinition,
  type ValidAbilityId,
  type Target,
  type CoordinateTarget,
} from '../../../definition/src/v1/abilityDefinition';

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
  console.log(JSON.parse(JSON.stringify(finalState)));
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [queuedTargetInputs, setQueuedTargetInputs] = useState<
    EffectTargetDefinition[]
  >([]);
  const [chosenTargets, setChosenTargets] = useState<Target[]>([]);
  const nextTargetInput =
    queuedTargetInputs.length > 0 ? queuedTargetInputs[0] : null;
  const choosingTargets = !!nextTargetInput;

  return (
    <Box className="w-full h-full mt-10 flex flex-col p-5 gap-2">
      <Box className="flex flex-row gap-2">
        {hand.map((card, index) => (
          <Card
            selected={selectedCard?.instanceId === card.instanceId}
            key={index}
            info={card}
            onClick={() => {
              const cardDef = cardDefinitions[card.cardId as ValidCardId];
              const isTactic = cardDef.kind === 'tactic';
              if (isTactic) {
                const abilityDef =
                  abilityDefinitions[card.cardId as ValidAbilityId];
                if (abilityDef.type !== 'tactic') {
                  throw new Error('Card is not a tactic');
                }
                if ('input' in abilityDef) {
                  const targetInputs = abilityDef.input.targets;
                  setQueuedTargetInputs(targetInputs);
                  setSelectedCard(card);
                } else {
                  prepareTurn({
                    action: {
                      type: 'tactic',
                      card,
                      input: { targets: chosenTargets },
                    },
                  });
                }
                return;
              }
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
        {freeActions.length > 0 && (
          <span>
            Free {freeActions[0].type} action (x {freeActions[0].count ?? 1})
          </span>
        )}
        {choosingTargets ? (
          <span>{queuedTargetInputs[0].description}</span>
        ) : null}
        <span>{turnError}</span>
        <span>{JSON.stringify(localTurnData)}</span>
      </Box>
      <Board
        selectedSpace={selectedSpace}
        state={board}
        onClick={(coord) => {
          if (choosingTargets && nextTargetInput.type === 'coordinate') {
            const target: CoordinateTarget = {
              kind: 'coordinate',
              x: coord.x,
              y: coord.y,
            };

            if (queuedTargetInputs.length === 1 && selectedCard) {
              prepareTurn({
                action: {
                  type: 'tactic',
                  card: selectedCard,
                  input: { targets: [...chosenTargets, target] },
                },
              });
              setSelectedCard(null);
              setChosenTargets([]);
              setQueuedTargetInputs([]);
            } else {
              setChosenTargets((prev) => [...prev, target]);
              setQueuedTargetInputs((prev) => prev.slice(1));
            }
            return;
          }
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
