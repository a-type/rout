import {
  AvatarList,
  Box,
  Button,
  EmojiPicker,
  Icon,
  Popover,
  Text,
  Tooltip,
} from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '../players/PlayerAvatar.js';
import cls from './ChatReactions.module.css';

export interface ChatReactionsProps {
  message: GameSessionChatMessage;
  className?: string;
}

export const ChatReactions = withGame<ChatReactionsProps>(
  function ChatReactions({ message, className, gameSuite }) {
    return (
      <Box gap wrap round="lg" className={className}>
        <Popover>
          <Popover.Trigger render={<Button size="wrapper" emphasis="ghost" />}>
            <Icon name="smile" />
          </Popover.Trigger>
          <Popover.Content>
            <Popover.Arrow />
            <EmojiPicker
              onValueChange={(v) => {
                gameSuite.toggleChatReaction(message, v);
              }}
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
                color={
                  users.includes(gameSuite.playerId) ? 'accent' : 'primary'
                }
                surface
                className={cls.display}
                onClick={() => gameSuite.toggleChatReaction(message, emoji)}
              >
                <span className={cls.emoji}>{emoji}</span>{' '}
                {users.length > 1 && (
                  <Text emphasis="ambient" dim bold>
                    {users.length}
                  </Text>
                )}
              </Box>
            </Tooltip>
          ))}
      </Box>
    );
  },
);
