import { Box } from '@a-type/ui';
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

function FighterCard({
  cardData,
  onClick,
  selected,
  fatigued,
  continuousEffects,
  cardStack,
  color,
}: BaseCardProps & {
  cardData: FighterCard;
  continuousEffects?: ContinuousEffect[];
  cardStack?: CardStack;
}) {
  const textColor = fatigued ? 'gray' : 'white';
  return (
    <>
      <Box
        className="w-full h-full"
        border
        p="md"
        style={{
          width: '150px',
          height: '150px',
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
      {cardStack &&
        cardStack.length > 1 &&
        Array.from({ length: cardStack.length - 1 }).map((_, idx) => (
          <Box
            className="flex flex-row gap-2 border"
            border
            key={idx}
            style={{
              marginLeft: '-3px',
              width: '10px',
              height: '150px',
              borderColor: color,
              background: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              borderLeft: 'none',
              borderTopLeftRadius: '0px',
              borderBottomLeftRadius: '0px',
            }}
          ></Box>
        ))}
    </>
  );
}

function TacticCard({
  cardData,
  onClick,
  selected,
  color,
}: BaseCardProps & { cardData: TacticCard }) {
  return (
    <Box
      className="w-full h-full"
      border
      p="md"
      style={{
        width: '150px',
        height: '150px',
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
  const { cardId, ownerId, fatigued, continuousEffects } = info;
  // @ts-expect-error Fix this up
  const player: PlayerInfo = players[ownerId];
  const { color } = player ?? { color: 'black' };

  // @ts-expect-error Fix this up
  const cardData = cardDefinitions[cardId];
  if (!cardData) {
    throw new Error(`Card ${cardId} not found`);
  }

  if (cardData.kind === 'fighter') {
    return (
      <FighterCard
        cardStack={stack}
        cardData={cardData}
        color={color}
        fatigued={fatigued}
        continuousEffects={continuousEffects}
        {...rest}
      />
    );
  }
  return <TacticCard cardData={cardData} color={color} {...rest} />;
}
