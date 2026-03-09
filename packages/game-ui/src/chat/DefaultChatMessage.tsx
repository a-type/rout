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
import { AbstractGameSuite, withGame } from '@long-game/game-client';
import { PlayerAvatar } from '../players/PlayerAvatar.js';
import { PlayerName } from '../players/PlayerName.js';
import { usePlayerThemed } from '../players/usePlayerThemed.js';
import { ChatReactions } from './ChatReactions.js';
import { ChatTextWithTokens } from './ChatTextWithTokens.js';

export interface ChatMessageProps extends BoxProps {
  message: GameSessionChatMessage;
  previousMessage: GameSessionChatMessage | null;
  nextMessage: GameSessionChatMessage | null;
  compact: boolean;
}

const DefaultChatMessageImpl = withGame<ChatMessageProps>(
  function ChatMessage(props) {
    return (
      <DefaultChatMessageRoot {...props}>
        <DefaultChatMessageAuthor {...props} />
        <DefaultChatMessageBubble {...props}>
          <DefaultChatMessageContent {...props} />
        </DefaultChatMessageBubble>
        <DefaultChatMessageMetadata {...props} />
      </DefaultChatMessageRoot>
    );
  },
);

function useChatMessageDetails(
  { message, nextMessage, previousMessage }: ChatMessageProps,
  gameSuite: AbstractGameSuite<any>,
) {
  const isPreviousMessageSameAuthor =
    previousMessage?.authorId === message.authorId;
  const isNextMessageSameAuthor = nextMessage?.authorId === message.authorId;
  const nextMessageIsLongFromNow =
    !nextMessage ||
    new Date(nextMessage.createdAt).getTime() >
      new Date(message.createdAt).getTime() + 1000 * 60 * 5;
  const isFuture = gameSuite.viewingRoundIndex < message.roundIndex;
  const isSelf = gameSuite.playerId === message.authorId;
  const isSystem = message.authorId === SYSTEM_CHAT_AUTHOR_ID;
  const isDm = !!message.recipientIds?.length;

  return {
    isPreviousMessageSameAuthor,
    isNextMessageSameAuthor,
    nextMessageIsLongFromNow,
    isFuture,
    isSelf,
    isSystem,
    isDm,
  };
}

const DefaultChatMessageRoot = withGame<ChatMessageProps>(
  function DefaultChatMessageRoot({ gameSuite, ...props }) {
    const { isSystem, isSelf, isFuture, isPreviousMessageSameAuthor } =
      useChatMessageDetails(props, gameSuite);

    const { className: themeClass, style: themeStyle } = usePlayerThemed(
      props.message.authorId === SYSTEM_CHAT_AUTHOR_ID
        ? null
        : props.message.authorId,
    );
    return (
      <Box
        d="col"
        className={clsx(
          isSystem ? 'palette-gray' : themeClass,
          isSelf ? 'ml-auto' : 'mr-auto',
          isFuture && 'opacity-50',
          props.compact && 'w-full',
          props.className,
          !props.compact && !isPreviousMessageSameAuthor && 'mt-md',
        )}
        gap="xs"
        style={props.style ? { ...themeStyle, ...props.style } : themeStyle}
        items={props.compact ? 'stretch' : isSelf ? 'end' : 'start'}
      >
        {props.children}
      </Box>
    );
  },
);

const DefaultChatMessageAuthor = withGame<ChatMessageProps>(
  function DefaultChatMessageAuthor({ gameSuite, ...props }) {
    const { isPreviousMessageSameAuthor, isSelf } = useChatMessageDetails(
      props,
      gameSuite,
    );
    if (isPreviousMessageSameAuthor) return null;
    return (
      <Box
        className={clsx(
          'absolute top-0 -translate-y-3/5 rounded-12px text-xs bg-main-light color-black z-1',
          isSelf ? 'right-0' : 'left-0',
        )}
        gap="sm"
        items="center"
      >
        <PlayerAvatar
          playerId={props.message.authorId}
          className="flex-shrink-0 w-16px h-auto"
          interactive
        />
        <span className="font-bold block pr-md py-xs text-nowrap overflow-hidden">
          <PlayerName playerId={props.message.authorId} />
        </span>
      </Box>
    );
  },
);

const DefaultChatMessageMetadata = withGame<ChatMessageProps>(
  function DefaultChatMessageMetadata({ gameSuite, ...props }) {
    const { isNextMessageSameAuthor, nextMessageIsLongFromNow, isSelf, isDm } =
      useChatMessageDetails(props, gameSuite);
    if (props.compact) return null;

    return (
      <Box
        className="text-xs color-gray-dark px-sm"
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
                <AvatarList count={props.message.recipientIds!.length}>
                  {props.message.recipientIds!.map((id, index) => (
                    <AvatarList.ItemRoot key={id} index={index}>
                      <PlayerAvatar playerId={id} />
                    </AvatarList.ItemRoot>
                  ))}
                </AvatarList>
              </Popover.Content>
              <Popover.Trigger
                render={
                  <Button
                    size="small"
                    className="px-xs py-xs my-auto bg-accent-wash -mt-6px"
                    emphasis="ghost"
                  />
                }
              >
                <Icon name="lock" />
              </Popover.Trigger>
            </Popover>
          )}
          {(!isNextMessageSameAuthor || nextMessageIsLongFromNow) && (
            <span className="italic text-nowrap">
              <RelativeTime
                abbreviate
                value={new Date(props.message.createdAt).getTime()}
              />
            </span>
          )}
        </Box>
        <ChatReactions
          message={props.message}
          className={clsx('relative -top-4px z-10 bg-wash [font-style:normal]')}
        />
      </Box>
    );
  },
);

const DefaultChatMessageBubble = withGame<ChatMessageProps>(
  function DefaultChatMessageBody({ gameSuite, className, ...props }) {
    const { isPreviousMessageSameAuthor, isNextMessageSameAuthor, isSelf } =
      useChatMessageDetails(props, gameSuite);
    return (
      <Box
        d="col"
        surface
        items="start"
        gap="sm"
        elevated={props.compact ? undefined : 'sm'}
        border={!props.compact}
        className={clsx(
          'bg-main-wash bg-lighten-2 color-black',
          'transition-opacity',
          'px-md py-sm',
          {
            'rounded-tr-0':
              !props.compact && isSelf && !isPreviousMessageSameAuthor,
            'rounded-tl-0':
              !props.compact && !isSelf && !isPreviousMessageSameAuthor,
            'rounded-br-0':
              !props.compact && isSelf && !isNextMessageSameAuthor,
            'rounded-bl-0':
              !props.compact && !isSelf && !isNextMessageSameAuthor,
            'rounded-0': props.compact,
          },
          className,
        )}
      >
        {props.children}
      </Box>
    );
  },
);

const DefaultChatMessageContent = withGame<ChatMessageProps>(
  function DefaultChatMessageContent({ message, className }) {
    return (
      <div
        className={clsx(
          'w-full leading-relaxed whitespace-pre-wrap',
          className,
        )}
      >
        <ChatTextWithTokens>{message.content}</ChatTextWithTokens>
      </div>
    );
  },
);

export const DefaultChatMessage = Object.assign(DefaultChatMessageImpl, {
  useChatMessageDetails,
  Root: DefaultChatMessageRoot,
  Author: DefaultChatMessageAuthor,
  Bubble: DefaultChatMessageBubble,
  Content: DefaultChatMessageContent,
  Metadata: DefaultChatMessageMetadata,
});

export default DefaultChatMessage;
