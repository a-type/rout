import {
  AvatarList,
  Box,
  BoxProps,
  Button,
  clsx,
  Icon,
  Popover,
  RelativeTime,
  Text,
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
import cls from './DefaultChatMessage.module.css';

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
        col
        data-is-self={isSelf}
        data-is-system={isSystem}
        data-is-future={isFuture}
        data-compact={props.compact}
        data-is-previous-message-same-author={isPreviousMessageSameAuthor}
        className={clsx(
          cls.root,
          isSystem ? '@mode-neutral' : themeClass,
          props.className,
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
        className={clsx('@mode-denser', cls.author)}
        data-is-self={isSelf}
        gap="sm"
        items="center"
      >
        <PlayerAvatar
          playerId={props.message.authorId}
          className={cls.avatar}
          interactive
        />
        <Text emphasis="secondary" bold className={cls.name}>
          <PlayerName playerId={props.message.authorId} />
        </Text>
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
        className={cls.metadata}
        dim
        full="width"
        gap
        justify="between"
        reverse={isSelf}
      >
        <Box gap>
          {isDm && (
            <Popover>
              <Popover.Content className={cls.popover}>
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
                    size="wrapper"
                    className={cls.privacyTrigger}
                    emphasis="ghost"
                  />
                }
              >
                <Icon name="lock" />
              </Popover.Trigger>
            </Popover>
          )}
          {(!isNextMessageSameAuthor || nextMessageIsLongFromNow) && (
            <Text italic wrap={false}>
              <RelativeTime
                abbreviate
                value={new Date(props.message.createdAt).getTime()}
              />
            </Text>
          )}
        </Box>
        <ChatReactions message={props.message} className={cls.reactions} />
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
        col
        surface
        items="start"
        gap="sm"
        elevated={props.compact ? undefined : 'sm'}
        border={!props.compact}
        data-compact={props.compact}
        data-is-self={isSelf}
        data-is-previous-message-same-author={isPreviousMessageSameAuthor}
        data-is-next-message-same-author={isNextMessageSameAuthor}
        className={clsx(cls.bubble, className)}
      >
        {props.children}
      </Box>
    );
  },
);

const DefaultChatMessageContent = withGame<ChatMessageProps>(
  function DefaultChatMessageContent({ message, className }) {
    return (
      <div className={clsx(cls.content, className)}>
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
