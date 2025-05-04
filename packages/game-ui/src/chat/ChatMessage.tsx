import { Box, BoxProps, Button, Icon, RelativeTime } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '../players/PlayerAvatar';
import { PlayerName } from '../players/PlayerName';
import { spatialChatState } from './spatialChatState';

export interface ChatMessageProps extends BoxProps {
  message: GameSessionChatMessage;
}

export const ChatMessage = withGame<ChatMessageProps>(function ChatMessage({
  gameSuite,
  message,
  className,
  ...rest
}) {
  const revealSpatialChat = () => {
    if (!message.sceneId) {
      return;
    }

    spatialChatState.revealedSpatialChatId = message.id;
  };

  return (
    <Box d="col" items="start" gap="sm" className={className} {...rest}>
      <Box gap className="leading-relaxed block text-wrap" full="width">
        <PlayerAvatar playerId={message.authorId} className="absolute" />
        <span className="font-bold" style={{ marginLeft: 32 }}>
          <PlayerName playerId={message.authorId} />:{' '}
        </span>
        <span className="whitespace-pre-wrap">{message.content}</span>
      </Box>
      <Box
        className="text-xs text-gray-dark italic px-sm"
        justify="between"
        items="center"
        full="width"
      >
        <RelativeTime value={new Date(message.createdAt).getTime()} />
        {message.sceneId && (
          <Button
            size="icon-small"
            color="ghost"
            className="p-0"
            onClick={revealSpatialChat}
          >
            <Icon name="location" />{' '}
          </Button>
        )}
      </Box>
    </Box>
  );
});
