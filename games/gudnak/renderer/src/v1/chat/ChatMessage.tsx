import React from 'react';
import { ChatMessageProps, DefaultChatMessage } from '@long-game/game-ui';
import { ChatCard } from './ChatCard';
import { ChatCoordinate } from './ChatCoordinate';
import { ChatPlayer } from './ChatPlayer';

export function CustomChatMessage({ message, ...rest }: ChatMessageProps) {
  const content = message.metadata?.richContent ?? (message.content as string);

  // Function to parse and replace placeholders
  const parseContent = (text: string) => {
    const regex = /<card\|([^>]+)>|<player\|([^>]+)>|<coordinate\|([^>]+)>/g;
    const parts: (string | React.JSX.Element)[] = [];
    let lastIndex = 0;

    text.replace(
      regex,
      (match, cardInstanceId, playerId, coordinate, offset) => {
        // Push the text before the match
        if (offset > lastIndex) {
          parts.push(text.slice(lastIndex, offset));
        }

        // Replace <card|id> with a Card component
        if (cardInstanceId) {
          parts.push(
            <ChatCard instanceId={cardInstanceId} key={cardInstanceId} />,
          );
        }

        if (playerId) {
          parts.push(
            <div className="flex gap-1 color-primary" key={playerId}>
              <ChatPlayer playerId={playerId} />
            </div>,
          );
        }

        if (coordinate) {
          const coord = coordinate.split(',').map(Number);
          const [x, y] = coord;
          parts.push(<ChatCoordinate coordinate={{ x, y }} />);
        }

        lastIndex = offset + match.length;
        return match;
      },
    );

    // Push the remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const parsedContent = parseContent(content);

  const customMessage = { ...message, content: parsedContent as any };

  return <DefaultChatMessage message={customMessage} {...rest} />;
}
