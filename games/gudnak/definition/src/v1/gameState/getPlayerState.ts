import type { Card, GlobalState } from '../gameDefinition';
import { getCardIdsFromBoard, getSpecialSpaces } from './board';

export function getPlayerState({
  globalState,
  playerId,
  members,
}: {
  globalState: GlobalState;
  playerId: string;
  members: { id: string }[];
}) {
  const { playerState, currentPlayer, actions, board, freeActions } =
    globalState;
  const { hand, deck, discard, side } = playerState[playerId];
  const visibleCardIds = [...hand, ...discard, ...getCardIdsFromBoard(board)];
  return {
    board,
    cardState: visibleCardIds.reduce((acc, id) => {
      acc[id] = globalState.cardState[id];
      return acc;
    }, {} as Record<string, Card>),
    hand: hand.map((instanceId) => globalState.cardState[instanceId]),
    discard: discard.map((instanceId) => globalState.cardState[instanceId]),
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
