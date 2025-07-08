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
import { ChatReactions } from './ChatReactions';
import { spatialChatState } from './spatialChatState';

export interface ChatMessageProps extends BoxProps {
  message: GameSessionChatMessage;
  previousMessage: GameSessionChatMessage | null;
  nextMessage: GameSessionChatMessage | null;
  compact: boolean;
}

export const DefaultChatMessage = withGame<ChatMessageProps>(
  function ChatMessage({
    gameSuite,
    message,
    className,
    style,
    nextMessage,
    previousMessage,
    compact,
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
      <Box
        d="col"
        className={clsx(
          isSystem ? 'theme theme-salt' : themeClass,
          isSelf ? 'ml-auto' : 'mr-auto',
          isFuture && 'opacity-50',
          compact && 'w-full',
          className,
          !compact && !isPreviousMessageSameAuthor && 'mt-md',
        )}
        gap="xs"
        style={style ? { ...themeStyle, ...style } : themeStyle}
        items={compact ? 'stretch' : isSelf ? 'end' : 'start'}
      >
        {!isPreviousMessageSameAuthor && (
          <Box
            className={clsx(
              'absolute top-0 -translate-y-3/5 rounded-12px text-xs bg-primary-wash bg-lighten-1 color-black z-1',
              isSelf ? 'right-0' : 'left-0',
            )}
            gap="sm"
            items="center"
          >
            <PlayerAvatar
              playerId={message.authorId}
              className="flex-shrink-0 w-16px h-auto"
            />
            <span className="font-bold block pr-md py-xs text-nowrap overflow-hidden">
              <PlayerName playerId={message.authorId} />
            </span>
          </Box>
        )}
        <Box
          d="col"
          surface
          items="start"
          gap="sm"
          className={clsx(
            'bg-primary-wash bg-lighten-2 color-black',
            'shadow-sm',
            'transition-opacity',
            'px-md py-sm',
            !isPreviousMessageSameAuthor &&
              (isSelf ? 'rounded-tr-0' : 'rounded-tl-0'),
            isSelf ? 'rounded-br-0' : 'rounded-bl-0',
          )}
          {...rest}
        >
          <Box
            className={clsx('leading-relaxed whitespace-pre-wrap')}
            full="width"
          >
            {message.content}
          </Box>
        </Box>
        {!compact && (
          <Box
            className="text-xs text-gray-dark px-sm"
            full="width"
            gap
            justify="between"
            d={isSelf ? 'row-reverse' : 'row'}
          >
            <Box d="row" gap>
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
                      className="px-xs py-xs my-auto bg-accent-wash -mt-6px"
                      color="ghost"
                    >
                      <Icon name="lock" />
                    </Button>
                  </Popover.Trigger>
                </Popover>
              )}
              {(!isNextMessageSameAuthor || nextMessageIsLongFromNow) && (
                <span className="italic text-nowrap">
                  <RelativeTime
                    abbreviate
                    value={new Date(message.createdAt).getTime()}
                  />
                </span>
              )}
              {message.sceneId && (
                <Button
                  size="icon-small"
                  color="ghost"
                  className="p-0 ml-auto"
                  onClick={revealSpatialChat}
                >
                  <Icon name="location" />
                </Button>
              )}
            </Box>
            {!compact && (
              <ChatReactions
                message={message}
                className={clsx(
                  'relative -top-4px z-10 bg-wash [font-style:normal]',
                )}
              />
            )}
          </Box>
        )}
      </Box>
    );
  },
);
