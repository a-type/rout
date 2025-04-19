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
import { useGameSuite } from '@long-game/game-client';
import { hooks } from './gameClient';

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

const CARD_SIZE = 200;

function FighterCard({
  cardData,
  onClick,
  selected,
  fatigued,
  continuousEffects,
  instanceId,
  targeted,
}: BaseCardProps & {
  cardData: FighterCard;
  continuousEffects?: ContinuousEffect[];
  cardStack?: CardStack;
}) {
  const textColor = fatigued ? 'gray' : 'white';
  if (cardData.artUrl) {
    return (
      <Flipped flipId={instanceId}>
        {(flippedProps) => (
          <Tooltip
            content={<img src={cardData.artUrl} width={CARD_SIZE * 2} />}
          >
            <Box
              {...flippedProps}
              className={clsx(
                'w-full h-full border-primary rounded-lg bg-cover',
                selected && 'bg-primary-light',
                targeted && 'bg-primary-wash',
                fatigued && 'bg-gray-800',
              )}
              border
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <img
                className={clsx(
                  (selected || targeted || fatigued) && 'mix-blend-screen',
                )}
                src={cardData.artUrl}
                width={CARD_SIZE - 4}
              />
            </Box>
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
  instanceId,
  onClick,
  selected,
}: BaseCardProps & { cardData: TacticCard }) {
  if (cardData.artUrl) {
    return (
      <Flipped flipId={instanceId}>
        {(flippedProps) => (
          <Tooltip
            content={<img src={cardData.artUrl} width={CARD_SIZE * 2} />}
          >
            <Box
              {...flippedProps}
              className={clsx(
                'w-full h-full border-primary rounded-lg bg-cover',
                selected && 'bg-primary-light',
              )}
              border
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <img
                className="mix-blend-screen"
                src={cardData.artUrl}
                width={CARD_SIZE - 4}
              />
            </Box>
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

  const cardData = cardDefinitions[cardId];
  if (!cardData) {
    throw new Error(`Card ${cardId} not found`);
  }

  if (cardData.kind === 'fighter') {
    return (
      <div className={className} style={style}>
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
                  cardData={cardDefinitions[cardState[c].cardId] as FighterCard}
                  fatigued={fatigued}
                  continuousEffects={continuousEffects}
                  instanceId={c}
                />
              </div>
            ))}
        <FighterCard
          cardData={cardData}
          fatigued={fatigued}
          continuousEffects={continuousEffects}
          {...rest}
        />

        {/* // <Box
            //   className="flex flex-row gap-2 border-primary ml-[-3px] w-[10px] border-l-none"
            //   border
            //   key={idx}
            //   style={{
            //     height: CARD_SIZE,
            //     borderTopLeftRadius: '0px',
            //     borderBottomLeftRadius: '0px',
            //   }}
            // ></Box> */}
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      <TacticCard cardData={cardData} {...rest} />
    </div>
  );
}
