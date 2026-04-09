import { chatTokens, PrefixedId } from '@long-game/common';
import { SystemChatMessage } from '@long-game/game-definition';
import { GlobalState } from './gameDefinition';
import { getDistinctPaths, scorePath } from './scoring';

export type PathEvent = {
  type: 'broken' | 'completed';
  playerId: PrefixedId<'u'>;
  pathId: string;
};

export interface RichChatMetadata {
  rich: true;
  event: PathEvent;
}

export function isRichChatMessage(
  message: SystemChatMessage,
): message is SystemChatMessage & { metadata: RichChatMetadata } {
  return (
    !!message.metadata && 'rich' in message.metadata && message.metadata.rich
  );
}

export function eventToChatMessage(
  event: PathEvent,
  gameState: GlobalState,
): SystemChatMessage | null {
  const playerBoard = gameState.playerBoards[event.playerId];
  const paths = getDistinctPaths(playerBoard);
  const path = paths.find((p) => p.id === event.pathId);
  if (!path) {
    return null;
  }

  const score = scorePath(path);

  switch (event.type) {
    case 'broken':
      if (score > 10) {
        return {
          content: `Oof! ${chatTokens.playerHandle(event.playerId)} broke a path worth ${score} points!`,
          metadata: {
            rich: true,
            event,
          },
        };
      }
      break;
    case 'completed':
      return {
        content: `${chatTokens.playerHandle(event.playerId)} completed a path worth ${score} points!`,
        metadata: {
          rich: true,
          event,
        },
      };
  }

  return null;
}
