import { Box, BoxProps, clsx, Dialog, Icon, Popover } from '@a-type/ui';
import { GameSessionChatMessage } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import {
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { subscribe } from 'valtio';
import { DropInfo, Droppable } from '../dnd';
import { DraggableData } from '../dnd/dndStore';
import { DragGestureContext } from '../dnd/gestureStore';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useMergedRef } from '../hooks/useMergedRef';
import { PlayerAvatar } from '../players/PlayerAvatar';
import { PlayerName } from '../players/PlayerName';
import { ChatForm } from './ChatForm';
import { SpatialChatShimmer } from './SpatialChatShimmer';
import { spatialChatState } from './spatialChatState';

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
  ref,
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
  const groupedByPosition = useMemo(
    () =>
      gameSuite.chat
        .filter((message) => message.sceneId === sceneId)
        .reduce(
          (acc, message) => {
            const key = `${message.position?.x ?? 0}-${message.position?.y ?? 0}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(message);
            return acc;
          },
          {} as Record<string, GameSessionChatMessage[]>,
        ),
    [gameSuite.chat, sceneId],
  );

  const innerRef = useRef<HTMLDivElement>(null);
  const handleDrop = (
    draggable: DraggableData,
    _: DragGestureContext,
    { relativePosition, droppableRect }: DropInfo,
  ) => {
    if (draggable.id !== 'spatial-chat') return;
    setPosition({
      x: relativePosition.x / droppableRect.width,
      y: relativePosition.y / droppableRect.height,
    });
  };

  const finalRef = useMergedRef(ref, innerRef);

  return (
    <SpatialChatShimmer
      className={clsx(
        'chat-root',
        'relative transition-all',
        !!visualize && 'hover:(ring-2 ring-accent)',
        className,
      )}
      onContextMenu={handleLongPress}
      data-scene-id={sceneId}
      ref={finalRef}
      {...props}
    >
      <Droppable
        id={`spatial-chat-${sceneId}`}
        onDrop={handleDrop}
        className="w-full h-full"
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
      </Droppable>
    </SpatialChatShimmer>
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

  const isMobile = useMediaQuery('(max-width: 768px)');

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
        <>
          <Box
            style={{
              left: position.x * 100 + '%',
              top: position.y * 100 + '%',
            }}
            surface
            p="sm"
            border
            className="absolute -translate-50% z-10000"
          >
            <Icon name="chat" />
            ...
          </Box>
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) onClose();
            }}
          >
            <Dialog.Content>{content}</Dialog.Content>
          </Dialog>
        </>
      )}
    </>
  );
});

const SpatialChatBubble = withGame<{
  message: GameSessionChatMessage;
}>(function SpatialChatBubble({ message }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const emoji = isEmoji(message.content);

  useEffect(() => {
    return subscribe(spatialChatState, () => {
      if (spatialChatState.revealedSpatialChatId === message.id) {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
        setOpen(true);
      }
    });
  }, [message.id]);

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
          ref={ref}
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
