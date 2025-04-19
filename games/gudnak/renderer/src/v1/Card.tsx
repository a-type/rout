import { Box, Tooltip } from '@a-type/ui';
import { PlayerInfo, useGameSuite } from '@long-game/game-client';
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
  color?: string;
  onClick?: () => void;
};

const CARD_SIZE = 200;

function FighterCard({
  cardData,
  onClick,
  selected,
  fatigued,
  continuousEffects,
  color,
  instanceId,
}: BaseCardProps & {
  cardData: FighterCard;
  continuousEffects?: ContinuousEffect[];
  cardStack?: CardStack;
  instanceId: string;
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
              className="w-full h-full"
              border
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
                borderColor: color,
                background: selected
                  ? 'rgba(255, 255, 255, 0.2)'
                  : fatigued
                  ? 'slategray'
                  : 'transparent',
                color: textColor,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <img
                src={cardData.artUrl}
                width={CARD_SIZE}
                style={{ opacity: fatigued ? 0.5 : 1 }}
              />
            </Box>
          </Tooltip>
        )}
      </Flipped>
    );
  }

  return (
    <Box
      className="w-full h-full"
      border
      p="md"
      style={{
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderColor: color,
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
  onClick,
  selected,
  color,
}: BaseCardProps & { cardData: TacticCard }) {
  if (cardData.artUrl) {
    return (
      <Tooltip content={<img src={cardData.artUrl} width={CARD_SIZE * 2} />}>
        <Box
          className="w-full h-full"
          border
          style={{
            width: CARD_SIZE,
            height: CARD_SIZE,
            borderColor: color,
            background: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <img src={cardData.artUrl} width={CARD_SIZE} />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      className="w-full h-full"
      border
      p="md"
      style={{
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderColor: color,
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
  const { players } = useGameSuite();
  const { cardId, ownerId, fatigued, continuousEffects, instanceId } = info;
  // @ts-expect-error Fix this up
  const player: PlayerInfo = players[ownerId];
  const { color } = player ?? { color: 'black' };

  const cardData = cardDefinitions[cardId];
  if (!cardData) {
    throw new Error(`Card ${cardId} not found`);
  }

  if (cardData.kind === 'fighter') {
    return (
      <>
        <FighterCard
          cardData={cardData}
          color={color}
          fatigued={fatigued}
          continuousEffects={continuousEffects}
          instanceId={instanceId}
          {...rest}
        />
        {stack &&
          stack.length > 1 &&
          Array.from({ length: stack.length - 1 }).map((_, idx) => (
            <Box
              className="flex flex-row gap-2 border"
              border
              key={idx}
              style={{
                marginLeft: '-3px',
                width: '10px',
                height: CARD_SIZE,
                borderColor: color,
                borderLeft: 'none',
                borderTopLeftRadius: '0px',
                borderBottomLeftRadius: '0px',
              }}
            ></Box>
          ))}
      </>
    );
  }
  return <TacticCard cardData={cardData} color={color} {...rest} />;
}
