import {
  AvatarList,
  Box,
  Button,
  clsx,
  EmojiPicker,
  Icon,
  Popover,
  Tooltip,
} from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '../players/PlayerAvatar.js';

export interface ChatReactionsProps {
  message: GameSessionChatMessage;
  className?: string;
}

export const ChatReactions = withGame<ChatReactionsProps>(
  function ChatReactions({ message, className, gameSuite }) {
    return (
      <Box gap wrap className={clsx('rounded-2xl', className)}>
        <Popover>
          <Popover.Trigger asChild>
            <Button size="icon-small" color="ghost" className="p-xs">
              <Icon name="smile" />
            </Button>
          </Popover.Trigger>
          <Popover.Content className="p-xs">
            <Popover.Arrow />
            <EmojiPicker
              onValueChange={(v) => gameSuite.toggleChatReaction(message.id, v)}
            />
          </Popover.Content>
        </Popover>
        {Object.entries(message.reactions)
          .filter(([_, users]) => users.length > 0)
          .map(([emoji, users]) => (
            <Tooltip
              key={emoji}
              content={
                <AvatarList count={users.length}>
                  {users.map((id, idx) => (
                    <AvatarList.ItemRoot index={idx} key={id}>
                      <PlayerAvatar playerId={id} />
                    </AvatarList.ItemRoot>
                  ))}
                </AvatarList>
              }
            >
              <Box
                gap="sm"
                items="center"
                surface={
                  users.includes(gameSuite.playerId) ? 'accent' : 'default'
                }
                className="cursor-pointer text-sm rounded-full py-xs px-sm"
                onClick={() => gameSuite.toggleChatReaction(message.id, emoji)}
              >
                <span className="hover:scale-150% transition-transform">
                  {emoji}
                </span>{' '}
                {users.length > 1 && (
                  <span className="color-gray-dark font-bold text-xs">
                    {users.length}
                  </span>
                )}
              </Box>
            </Tooltip>
          ))}
      </Box>
    );
  },
);
