import { Box } from '@a-type/ui';
import { PlayerInfo, useGameSuite } from '@long-game/game-client';
import {
  cardDefinitions,
  type FighterCard,
  type TacticCard,
} from '@long-game/game-gudnak-definition';
import { type Card as CardType } from '@long-game/game-gudnak-definition/v1';

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
  fatigued?: boolean;
  color?: string;
  onClick?: () => void;
};

function FighterCard({
  cardData,
  onClick,
  selected,
  fatigued,
  color,
}: BaseCardProps & { cardData: FighterCard }) {
  return (
    <Box
      className="w-full h-full"
      border
      p="md"
      style={{
        opacity: fatigued ? 0.6 : 1,
        maxWidth: '200px',
        borderColor: color,
        background: selected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      }}
      onClick={onClick}
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
  return (
    <Box className="w-full h-full" onClick={onClick}>
      <Box className="flex flex-col">
        <Box className="flex flex-row">
          <div>{cardData.cost}</div>
          <div>{cardData.name}</div>
        </Box>
        <hr className="w-full" />
        <div>{cardData.ability}</div>
      </Box>
    </Box>
  );
}

export function Card({
  info,
  ...rest
}: BaseCardProps & {
  info: CardType;
}) {
  const { players } = useGameSuite();
  const { cardId, ownerId, fatigued } = info;
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
        cardData={cardData}
        color={color}
        fatigued={fatigued}
        {...rest}
      />
    );
  }
  return <TacticCard cardData={cardData} color={color} {...rest} />;
}
