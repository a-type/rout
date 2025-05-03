import { Box, clsx, Popover } from '@a-type/ui';
import { useDndContext } from '@dnd-kit/core';
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
import { usePlayerThemed } from '@long-game/game-ui';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { cardImageLookup } from './cardImageLookup';
import { Draggable } from './Draggable';
import { hooks } from './gameClient';
import cardBack from './images/cardback.png';
import { useDoubleClick } from './useDoubleClick';
import { useViewState } from './useViewState';

type BaseCardProps = {
  selected?: boolean;
  targeted?: boolean;
  fatigued?: boolean;
  instanceId: string;
  onClick?: () => void;
  disableTooltip?: boolean;
  noBorder?: boolean;
};

export const CARD_SIZE = 200;

export type DragData = {
  instanceId: string;
  cardInfo: CardType;
};

const useTriggerTooltip = ({ cardInstanceId }: { cardInstanceId: string }) => {
  const { setViewState } = useViewState();
  // trigger tooltip when user hovers over the card on pc or taps on it on mobile
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(false);
  const { active: dragActive } = useDndContext();

  const [onClickOrTap] = useDoubleClick(() => {
    setViewState({ kind: 'cardViewer', cardInstanceId });
  }, 400);

  useEffect(() => {
    if (hovered) {
      const timeout = setTimeout(() => {
        setActive(true);
      }, 800);
      return () => {
        clearTimeout(timeout);
        setActive(false);
      };
    }
  }, [hovered]);

  useEffect(() => {
    if (touched) {
      const timeout = setTimeout(() => {
        setActive(true);
      }, 500);
      return () => {
        clearTimeout(timeout);
        setActive(false);
      };
    }
  }, [touched]);

  return {
    active: active && !dragActive,
    onMouseEnter: () => {
      setHovered(true);
    },
    onMouseLeave: () => {
      setHovered(false);
    },
    onClick: () => {
      onClickOrTap();
    },
    onTouchStart: () => {
      setTouched(true);
      onClickOrTap();
    },
    onTouchEnd: () => {
      setTouched(false);
    },
  };
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
  disableTooltip,
  noBorder,
}: BaseCardProps & {
  cardData: FighterCard | TacticCard;
  cardId: string;
  continuousEffects?: ContinuousEffect[];
  cardStack?: CardStack;
  overSpace?: boolean;
  faceDown?: boolean;
}) {
  const {
    active: tooltipActive,
    onClick: onTriggerClick,
    ...triggers
  } = useTriggerTooltip({ cardInstanceId: instanceId });
  const cardArt = cardImageLookup[cardId];
  return (
    <Flipped flipId={instanceId}>
      {(flippedProps) => (
        <Popover open={tooltipActive && !disableTooltip}>
          <Popover.Content padding="none" className="game-ui">
            <img src={cardArt} className="lg:max-w-md  sm:max-w-xs" />
          </Popover.Content>
          <Popover.Anchor>
            <motion.div
              data-card-id={instanceId}
              className="relative aspect-ratio-square"
              {...triggers}
              {...flippedProps}
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                data-id="card-back"
                className="absolute w-full h-full backface-hidden"
                variants={
                  overSpace
                    ? {}
                    : {
                        hover: {
                          scale: 1.05,
                        },
                        tap: {
                          scale: 0.9,
                        },
                      }
                }
              >
                <img className="w-full" src={cardBack} />
              </motion.div>
              <motion.div
                data-id="card-front"
                className="backface-hidden"
                initial={faceDown ? { rotateY: -180 } : { rotateY: 0 }}
                variants={
                  overSpace
                    ? {}
                    : {
                        hover: {
                          scale: 1.05,
                        },
                        tap: {
                          scale: 0.9,
                        },
                      }
                }
              >
                <Box
                  className={clsx(
                    'w-full h-full border-primary rounded-lg bg-cover',
                    selected && 'bg-primary-light',
                    targeted && 'bg-primary-wash',
                    fatigued && 'bg-gray-300',
                  )}
                  border={!noBorder}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                    onTriggerClick();
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
            </motion.div>
          </Popover.Anchor>
        </Popover>
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
