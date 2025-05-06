import {
  AvatarList,
  Box,
  BoxProps,
  Button,
  clsx,
  Icon,
  Popover,
  RelativeTime,
} from '@a-type/ui';
import {
  GameSessionChatMessage,
  SYSTEM_CHAT_AUTHOR_ID,
} from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '../players/PlayerAvatar';
import { PlayerName } from '../players/PlayerName';
import { usePlayerThemed } from '../players/usePlayerThemed';
import { spatialChatState } from './spatialChatState';

export interface ChatMessageProps extends BoxProps {
  message: GameSessionChatMessage;
  previousMessage: GameSessionChatMessage | null;
  nextMessage: GameSessionChatMessage | null;
}

export const DefaultChatMessage = withGame<ChatMessageProps>(
  function ChatMessage({
    gameSuite,
    message,
    className,
    style,
    nextMessage,
    previousMessage,
    ...rest
  }) {
    const isPreviousMessageSameAuthor =
      previousMessage?.authorId === message.authorId;
    const isNextMessageSameAuthor = nextMessage?.authorId === message.authorId;
    const nextMessageIsLongFromNow =
      !nextMessage ||
      new Date(nextMessage.createdAt).getTime() >
        new Date(message.createdAt).getTime() + 1000 * 60 * 5;
    const isFuture = gameSuite.viewingRoundIndex < message.roundIndex;
    const revealSpatialChat = () => {
      if (!message.sceneId) {
        return;
      }

      spatialChatState.revealedSpatialChatId = message.id;
    };

    const isSelf = gameSuite.playerId === message.authorId;
    const isSystem = message.authorId === SYSTEM_CHAT_AUTHOR_ID;
    const isDm = !!message.recipientIds?.length;

    const { className: themeClass, style: themeStyle } = usePlayerThemed(
      message.authorId === SYSTEM_CHAT_AUTHOR_ID ? null : message.authorId,
    );

    return (
      <Box d="col" className={clsx(className)} gap="xs">
        <Box
          d="col"
          surface
          items="start"
          gap="sm"
          p="md"
          className={clsx(
            isSelf ? 'ml-auto' : 'mr-auto',
            isSystem ? 'theme theme-salt' : themeClass,
            isFuture && 'opacity-50',
            'bg-primary-wash color-primary-ink',
            'shadow-sm',
            'transition-opacity',
            !isPreviousMessageSameAuthor && 'mt-lg',
          )}
          style={style ? { ...themeStyle, ...style } : themeStyle}
          {...rest}
        >
          {!isPreviousMessageSameAuthor && (
            <Box
              gap
              className={clsx(
                'absolute top-0 -translate-y-1/2 rounded-full text-xs bg-inherit',
                isSelf ? 'right-md' : 'left-md',
              )}
              items="center"
            >
              <PlayerAvatar
                playerId={message.authorId}
                className="flex-shrink-0 w-16px h-16px"
              />
              <span className="font-bold block pr-lg py-xs">
                <PlayerName playerId={message.authorId} />:{' '}
              </span>
            </Box>
          )}
          <Box
            className={clsx('leading-relaxed whitespace-pre-wrap')}
            full="width"
          >
            {message.content}
          </Box>
        </Box>
        <Box
          className="text-xs text-gray-dark italic px-sm"
          items="center"
          full="width"
          gap
          justify={isSelf ? 'end' : 'start'}
        >
          {isDm && (
            <Popover>
              <Popover.Content className="p-sm flex flex-row gap-sm items-center min-w-0">
                <Popover.Arrow />
                <span>DM:</span>
                <AvatarList count={message.recipientIds!.length}>
                  {message.recipientIds!.map((id, index) => (
                    <AvatarList.ItemRoot key={id} index={index}>
                      <PlayerAvatar playerId={id} />
                    </AvatarList.ItemRoot>
                  ))}
                </AvatarList>
              </Popover.Content>
              <Popover.Trigger asChild>
                <Button
                  size="icon-small"
                  className="px-xs py-xs my-auto bg-accent-wash"
                  color="ghost"
                >
                  <Icon name="lock" />
                </Button>
              </Popover.Trigger>
            </Popover>
          )}
          {(!isNextMessageSameAuthor || nextMessageIsLongFromNow) && (
            <RelativeTime
              abbreviate
              value={new Date(message.createdAt).getTime()}
            />
          )}
          {message.sceneId && (
            <Button
              size="icon-small"
              color="ghost"
              className="p-0 ml-auto"
              onClick={revealSpatialChat}
            >
              <Icon name="location" />{' '}
            </Button>
          )}
        </Box>
      </Box>
    );
  },
);
