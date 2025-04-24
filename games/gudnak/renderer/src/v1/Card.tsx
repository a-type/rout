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
import { useDndContext } from '@dnd-kit/core';
import { Draggable } from './Draggable';
import cardBack from './images/cardback.png';

type BaseCardProps = {
  selected?: boolean;
  targeted?: boolean;
  fatigued?: boolean;
  instanceId: string;
  onClick?: () => void;
};

export const CARD_SIZE = 200;

export type DragData = {
  instanceId: string;
  cardInfo: CardType;
};

export function RenderCard({
  onClick,
  selected,
  fatigued,
  instanceId,
  cardId,
  targeted,
  overSpace,
  faceDown,
}: BaseCardProps & {
  cardData: FighterCard | TacticCard;
  cardId: string;
  continuousEffects?: ContinuousEffect[];
  cardStack?: CardStack;
  overSpace?: boolean;
  faceDown?: boolean;
}) {
  const cardArt = cardImageLookup[cardId];
  return (
    <Flipped flipId={instanceId}>
      {(flippedProps) => (
        <Tooltip
          open={false}
          content={<img src={cardArt} width={CARD_SIZE * 2} />}
        >
          <div className="relative">
            {faceDown && (
              <motion.div
                className="absolute w-full h-full"
                animate={
                  faceDown
                    ? { rotateY: 0, zIndex: 99 }
                    : { rotateY: -180, zIndex: 0 }
                }
              >
                <img className="w-full" src={cardBack} />
              </motion.div>
            )}
            <motion.div
              whileTap={overSpace ? {} : { scale: 1.05 }}
              whileHover={overSpace ? {} : { scale: 0.95 }}
              animate={
                faceDown
                  ? { rotateY: -180, zIndex: 0 }
                  : { rotateY: 0, zIndex: 99, scale: overSpace ? 0.75 : 1 }
              }
            >
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
                    'w-full',
                    (selected || targeted) && 'mix-blend-screen',
                    fatigued && 'grayscale-50 mix-blend-multiply',
                  )}
                  src={cardArt}
                  onDragStart={(e) => {
                    e.preventDefault();
                  }}
                />
              </Box>
            </motion.div>
          </div>
        </Tooltip>
      )}
    </Flipped>
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

  const { over, active } = useDndContext();

  const overSpace =
    !!over?.data.current?.coordinate && active?.id === rest.instanceId;

  const cardData = cardDefinitions[cardId];
  if (!cardData) {
    throw new Error(`Card ${cardId} not found`);
  }

  if (cardData.kind === 'fighter') {
    return (
      <Draggable
        className={clsx(className, 'z-40 touch-manipulation')}
        style={style}
        data={{
          instanceId: rest.instanceId,
          cardInfo: info,
        }}
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
                <RenderCard
                  cardId={cardState[c].cardId}
                  cardData={cardDefinitions[cardState[c].cardId] as FighterCard}
                  fatigued={fatigued}
                  continuousEffects={continuousEffects}
                  instanceId={c}
                />
              </div>
            ))}
        <RenderCard
          cardId={cardId}
          cardData={cardData}
          fatigued={fatigued}
          continuousEffects={continuousEffects}
          overSpace={overSpace}
          {...rest}
        />
      </Draggable>
    );
  }
  return (
    <Draggable
      className={clsx(className, 'z-40 touch-manipulation')}
      style={style}
      data={{
        instanceId: rest.instanceId,
        cardInfo: info,
      }}
    >
      <RenderCard cardData={cardData} cardId={cardId} {...rest} />
    </Draggable>
  );
}
