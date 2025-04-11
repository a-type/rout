import { Box, BoxProps, clsx, Dialog, Popover } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { MouseEvent as ReactMouseEvent, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { PlayerAvatar } from '../players/PlayerAvatar';
import { PlayerName } from '../players/PlayerName';
import { ChatForm } from './ChatForm';

export interface SpatialChatProps extends BoxProps {
  sceneId: string;
  timing?: 'round' | 'endgame';
  visualize?: boolean;
}

export const SpatialChat = withGame<SpatialChatProps>(function SpatialChat({
  gameSuite,
  className,
  children,
  onContextMenu,
  sceneId,
  timing,
  visualize,
  ...props
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleLongPress = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    // get relative position to box as a percentage
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    setPosition({
      x: xPercent,
      y: yPercent,
    });

    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  const shownChats = gameSuite.chat.filter(
    (message) => message.sceneId === sceneId,
  );

  return (
    <Box
      className={clsx(
        'chat-root',
        'relative',
        !!visualize && 'hover:(ring-2 ring-accent)',
        className,
      )}
      onContextMenu={handleLongPress}
      {...props}
    >
      {children}
      {position !== null && (
        <Chatbox
          position={position}
          sceneId={sceneId}
          timing={timing}
          onClose={() => setPosition(null)}
        />
      )}
      {shownChats.map((message) => (
        <SpatialChatBubble message={message} key={message.id} />
      ))}
    </Box>
  );
});

const Chatbox = withGame<{
  position: { x: number; y: number };
  sceneId: string;
  timing?: 'round' | 'endgame';
  onClose: () => void;
}>(function Chatbox({ position, sceneId, timing, onClose }) {
  const content = (
    <ChatForm
      sceneId={sceneId}
      position={position}
      timing={timing}
      full="width"
      autoFocus
      onSent={onClose}
    />
  );

  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <>
      {!isMobile && (
        <Popover
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <Popover.Anchor asChild>
            <div
              style={{
                left: position.x * 100 + '%',
                top: position.y * 100 + '%',
              }}
              className="absolute -translate-50%"
            >
              💬
            </div>
          </Popover.Anchor>
          <Popover.Content className="p-sm">
            <Popover.Arrow />
            {content}
          </Popover.Content>
        </Popover>
      )}

      {isMobile && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <Dialog.Content>{content}</Dialog.Content>
        </Dialog>
      )}
    </>
  );
});

const SpatialChatBubble = withGame<{
  message: GameSessionChatMessage;
}>(function SpatialChatBubble({ message }) {
  const [open, setOpen] = useState(false);

  const emoji = isEmoji(message.content);

  return (
    <Popover open={!emoji && open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Box
          container="reset"
          surface
          p="xs"
          gap="xs"
          items="center"
          style={{
            left: (message.position?.x ?? 0) * 100 + '%',
            top: (message.position?.y ?? 0) * 100 + '%',
          }}
          className={clsx(
            'absolute z-10 opacity-0 hover:opacity-100 -translate-50% select-none',
            !emoji && 'hover:cursor-pointer',
            open && 'opacity-100',
            '[.chat-root:hover>&]:opacity-50',
          )}
        >
          <PlayerAvatar playerId={message.authorId} size={16} />
          <span className="text-sm">{emoji ? message.content : '💬'}</span>
        </Box>
      </Popover.Trigger>
      <Popover.Content className="p-sm">
        <Popover.Arrow />
        <Box d="col" full gap="xs">
          {message.content}
          <Box items="center" gap className="text-xs color-gray-dark">
            <PlayerName playerId={message.authorId} />
            <div className="ml-auto text-xs text-gray-dark">
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          </Box>
        </Box>
      </Popover.Content>
    </Popover>
  );
});

function isEmoji(text: string) {
  // emoji can be made of multiple characters
  const emojiRegex = /(\p{Emoji}|\p{Extended_Pictographic})/gu;
  return emojiRegex.test(text);
}
