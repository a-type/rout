import { Box, Button } from '@a-type/ui';
import { cardDefinitions } from '@long-game/game-gudnak-definition';
import type { ValidCardId } from '@long-game/game-gudnak-definition/v1';
import {
  abilityDefinitions,
  type Card as CardType,
  type CoordinateTarget,
  type EffectTargetDefinition,
  type Target,
  type ValidAbilityId,
} from '@long-game/game-gudnak-definition/v1';
import { useState } from 'react';
import { Board } from './Board';
import { Card } from './Card';
import { hooks } from './gameClient';
import { useTargeting } from './useTargeting';
import { useSelect } from './useSelect';

export function Client() {
  return (
    <Box>
      <GameState />
    </Box>
  );
}

const GameState = hooks.withGame(function LocalGuess({ gameSuite }) {
  const { prepareTurn, finalState, turnError, localTurnData } = gameSuite;
  const { hand, board, active, actions, deckCount, freeActions, cardState } =
    finalState;
  const selection = useSelect();
  const targeting = useTargeting();

  return (
    <Box className="w-full h-full mt-10 flex flex-col p-5 gap-2">
      <Box className="flex flex-row gap-2">
        {hand.map((card, index) => (
          <Card
            selected={selection.card?.instanceId === card.instanceId}
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
                  targeting.begin(targetInputs);
                  selection.set(card);
                } else {
                  prepareTurn({
                    action: {
                      type: 'tactic',
                      card,
                      input: { targets: targeting.chosen },
                    },
                  });
                }
                return;
              }
              selection.set(card);
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
        {targeting.next ? <span>{targeting.next.description}</span> : null}
        <span>{turnError}</span>
        <span>{JSON.stringify(localTurnData)}</span>
      </Box>
      <Board
        selectedSpace={selection.coordinate}
        state={board}
        onClick={(coord) => {
          if (targeting.next && targeting.next.type === 'coordinate') {
            const target: CoordinateTarget = {
              kind: 'coordinate',
              x: coord.x,
              y: coord.y,
            };

            // TODO: Handle this in a better way
            if (targeting.queued.length === 1 && selection.card) {
              prepareTurn({
                action: {
                  type: 'tactic',
                  card: selection.card,
                  input: { targets: [...targeting.chosen, target] },
                },
              });
              selection.clear();
              targeting.clear();
            } else {
              targeting.select(target);
            }
            return;
          }
          if (selection.card) {
            prepareTurn({
              action: { type: 'deploy', card: selection.card, target: coord },
            });
            selection.clear();
          } else if (selection.coordinate) {
            const stack = board[selection.coordinate.y][selection.coordinate.x];
            if (!stack) return;
            const topCard = stack[stack.length - 1];
            prepareTurn({
              action: {
                type: 'move',
                cardInstanceId: topCard,
                source: selection.coordinate,
                target: coord,
              },
            });
            selection.clear();
          } else {
            selection.set(coord);
          }
        }}
        onClickCard={(card) => {
          if (targeting.next && targeting.next.type === 'card') {
            targeting.select({
              kind: 'card',
              instanceId: card.instanceId,
            });
          }
        }}
      />
    </Box>
  );
});
export default Client;
