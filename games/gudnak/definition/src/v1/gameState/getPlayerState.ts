import type { Card, GlobalState, PlayerState } from '../gameDefinition';
import {
  getCardIdsFromBoard,
  getGatesCoord,
  getSpecialSpaces,
  getTopCard,
} from './board';
import { validateDefend } from './validation';

export function getPlayerState({
  globalState,
  playerId,
  members,
}: {
  globalState: GlobalState;
  playerId: string;
  members: { id: string }[];
}): PlayerState {
  const { playerState, currentPlayer, actions, board, freeActions } =
    globalState;
  const { hand, deck, discard, side } = playerState[playerId];
  const visibleCardIds = [
    ...hand,
    ...members.flatMap((m) => playerState[m.id].discard),
    ...getCardIdsFromBoard(board),
  ];

  return {
    board,
    cardState: visibleCardIds.reduce((acc, id) => {
      acc[id] = globalState.cardState[id];
      return acc;
    }, {} as Record<string, Card>),
    hand: hand.map((instanceId) => globalState.cardState[instanceId]),
    discard: discard.map((instanceId) => globalState.cardState[instanceId]),
    playerState,
    deckCount: deck.length,
    active: currentPlayer === playerId,
    actions,
    freeActions,
    side,
    specialSpaces: getSpecialSpaces(
      globalState,
      members.map((m) => m.id),
    ),
  };
}
