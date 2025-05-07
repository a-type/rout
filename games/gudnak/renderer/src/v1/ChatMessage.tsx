import React from 'react';
import { ChatMessageProps, DefaultChatMessage } from '@long-game/game-ui';
import { clsx, Tooltip } from '@a-type/ui';
import { hooks } from './gameClient';
import { cardDefinitions } from '@long-game/game-gudnak-definition';
import { ValidCardId } from '@long-game/game-gudnak-definition/v1';
import { cardImageLookup } from './cardImageLookup';

export function CustomChatMessage({ message, ...rest }: ChatMessageProps) {
  const {
    finalState,
    members,
    getPlayer,
    playerId: myPlayerId,
  } = hooks.useGameSuite();
  const content = message.content as string;

  const getCardInfo = (instanceId: string) => {
    return finalState.cardState[instanceId] ?? null;
  };

  const getCardDefinition = (instanceId: string) => {
    const card = getCardInfo(instanceId);
    if (!card) {
      return null;
    }
    const cardDef = cardDefinitions[card.cardId as ValidCardId];
    if (!cardDef) {
      return null;
    }
    return cardDef;
  };

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
          const cardInfo = getCardInfo(cardInstanceId);
          const friendly = cardInfo.ownerId === myPlayerId;
          const cardDef = getCardDefinition(cardInstanceId);
          const name = cardDef?.name ?? 'Unknown Card';
          parts.push(
            <Tooltip
              key={`card-${cardInstanceId}`}
              content={
                <img
                  className="max-w-[300px]"
                  src={cardImageLookup[getCardInfo(cardInstanceId).cardId]}
                />
              }
            >
              <span
                className={clsx(
                  'cursor-pointer',
                  friendly ? 'text-blue-500' : 'text-red-500',
                )}
              >
                {name}
              </span>
            </Tooltip>,
          );
        }

        if (playerId) {
          const { displayName } = getPlayer(playerId);
          parts.push(
            <Tooltip key={`player-${playerId}`} content={displayName}>
              <span className="text-green-500 cursor-pointer">
                {displayName}
              </span>
            </Tooltip>,
          );
        }

        if (coordinate) {
          const coord = coordinate.split(',').map(Number);
          const [x, y] = coord;
          const valid = x >= 0 && y >= 0;
          parts.push(
            <span className="text-yellow-500 cursor-pointer">
              {valid ? `(${x}, ${y})` : 'Invalid Coordinate'}
            </span>,
          );
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
