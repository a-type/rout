import { Box } from '@a-type/ui';
import {
  cardDefinitions,
  type FighterCard,
  type TacticCard,
} from '@long-game/game-gudnak-definition';

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
  onClick?: () => void;
};

function FighterCard({
  cardData,
  onClick,
  selected,
}: BaseCardProps & { cardData: FighterCard }) {
  return (
    <Box
      className="w-full h-full"
      border
      p="md"
      style={{
        maxWidth: '200px',
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
  id,
  ...rest
}: BaseCardProps & {
  id: keyof typeof cardDefinitions;
}) {
  const cardData = cardDefinitions[id];

  if (cardData.kind === 'fighter') {
    return <FighterCard cardData={cardData} {...rest} />;
  }
  return <TacticCard cardData={cardData} {...rest} />;
}
