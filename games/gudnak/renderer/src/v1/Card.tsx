import { Box, clsx, Tooltip } from '@a-type/ui';
import {
  cardDefinitions,
  type FighterCard,
  type TacticCard,
} from '@long-game/game-gudnak-definition';
import {
  CardStack,
  ContinuousEffect,
  type Card as CardType,
} from '@long-game/game-gudnak-definition/v1';
import { Flipped } from 'react-flip-toolkit';
import { usePlayerThemed } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { motion } from 'motion/react';
import { cardImageLookup } from './cardImageLookup';
import { useDraggable } from '@dnd-kit/core';

const traitToEmoji: Record<string, string> = {
  soldier: '🪖',
  hunter: '🪃',
  brute: '💪',
  token: '📦',
  hero: '⭐',
  demon: '👹',
};

type BaseCardProps = {
  selected?: boolean;
  targeted?: boolean;
  fatigued?: boolean;
  instanceId: string;
  onClick?: () => void;
};

export const CARD_SIZE = 200;

function FighterCard({
  cardData,
  onClick,
  selected,
  fatigued,
  continuousEffects,
  instanceId,
  cardId,
  targeted,
}: BaseCardProps & {
  cardData: FighterCard;
  cardId: string;
  continuousEffects?: ContinuousEffect[];
  cardStack?: CardStack;
}) {
  const textColor = fatigued ? 'gray' : 'white';
  const cardArt = cardImageLookup[cardId];
  if (cardArt) {
    return (
      <Flipped flipId={instanceId}>
        {(flippedProps) => (
          <Tooltip
            open={false}
            content={<img src={cardArt} width={CARD_SIZE * 2} />}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Box
                {...flippedProps}
                className={clsx(
                  'w-full h-full border-primary rounded-lg bg-cover',
                  selected && 'bg-primary-light',
                  targeted && 'bg-primary-wash',
                  fatigued && 'bg-gray-300',
                )}
                border
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <img
                  className={clsx(
                    (selected || targeted) && 'mix-blend-screen',
                    fatigued && 'grayscale-50 mix-blend-multiply',
                  )}
                  src={cardArt}
                  width="100%"
                  onDragStart={(e) => {
                    e.preventDefault();
                  }}
                />
              </Box>
            </motion.div>
          </Tooltip>
        )}
      </Flipped>
    );
  }

  return (
    <Box
      className="w-full h-full border-primary"
      border
      p="md"
      style={{
        width: CARD_SIZE,
        height: CARD_SIZE,
        background: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        color: textColor,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Box className="flex flex-col">
        <Box className="flex flex-row gap-2">
          <Box className="flex flex-col">
            <div>{cardData.power}</div>
            {cardData.traits.map((trait) => (
              <div key={trait} className="text-xs">
                {traitToEmoji[trait]}
              </div>
            ))}
          </Box>
          <div>{cardData.name}</div>
        </Box>
        <hr className="w-full" />
        {cardData.abilities.map((ability, index) => (
          <div key={index} className="text-xs">
            <span className="font-bold">{ability.name}:&nbsp;</span>
            <span>{ability.description}</span>
          </div>
        ))}
        {continuousEffects?.map((effect, index) => (
          <div key={index} className="text-xs">
            <span>{effect.description}</span>
          </div>
        ))}
      </Box>
    </Box>
  );
}

function TacticCard({
  cardData,
  cardId,
  instanceId,
  onClick,
  selected,
}: BaseCardProps & { cardData: TacticCard; cardId: string }) {
  const cardArt = cardImageLookup[cardId];
  if (cardArt) {
    return (
      <Flipped flipId={instanceId}>
        {(flippedProps) => (
          <Tooltip content={<img src={cardArt} width={CARD_SIZE * 2} />}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Box
                {...flippedProps}
                className={clsx(
                  'w-full h-full border-primary rounded-lg bg-cover',
                  selected && 'bg-primary-light',
                )}
                border
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <img className="mix-blend-screen" src={cardArt} width="100%" />
              </Box>
            </motion.div>
          </Tooltip>
        )}
      </Flipped>
    );
  }

  return (
    <Box
      className="w-full h-full border-primary"
      border
      p="md"
      style={{
        width: CARD_SIZE,
        height: CARD_SIZE,
        background: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Box className="flex flex-col w-full">
        <Box className="flex flex-row gap-2">
          <div>{cardData.cost}</div>
          <div>{cardData.name}</div>
        </Box>
        <hr className="w-full" />
        <div className="text-xs">{cardData.ability}</div>
      </Box>
    </Box>
  );
}

export function Card({
  info,
  stack,
  ...rest
}: BaseCardProps & {
  stack?: CardStack;
  info: CardType;
}) {
  const { finalState } = hooks.useGameSuite();
  const { cardState } = finalState;
  const { cardId, ownerId, fatigued, continuousEffects } = info;
  const { className, style } = usePlayerThemed(ownerId as `u-${string}`);

  const { setNodeRef, listeners, transform, attributes } = useDraggable({
    id: rest.instanceId,
    data: {
      instanceId: rest.instanceId,
    },
  });
  const style2 = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const cardData = cardDefinitions[cardId];
  if (!cardData) {
    throw new Error(`Card ${cardId} not found`);
  }

  if (cardData.kind === 'fighter') {
    return (
      <div
        className={className}
        style={{ ...style, ...style2 }}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
      >
        {stack &&
          stack.length > 1 &&
          stack
            .slice(0, -1)
            .reverse()
            .map((c, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${(stack.length - idx - 1) * 30 + 5}px`,
                }}
              >
                <FighterCard
                  cardId={cardState[c].cardId}
                  cardData={cardDefinitions[cardState[c].cardId] as FighterCard}
                  fatigued={fatigued}
                  continuousEffects={continuousEffects}
                  instanceId={c}
                />
              </div>
            ))}
        <FighterCard
          cardId={cardId}
          cardData={cardData}
          fatigued={fatigued}
          continuousEffects={continuousEffects}
          {...rest}
        />
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      <TacticCard cardData={cardData} cardId={cardId} {...rest} />
    </div>
  );
}
