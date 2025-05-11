import { Box } from '@a-type/ui';
import {
  Card as CardVal,
  getCardRank,
  getCardSuit,
} from '@long-game/game-hearts-definition/v1';
import { Token, TokenProps } from '@long-game/game-ui';

export interface CardProps extends Omit<TokenProps, 'id'> {
  id: CardVal;
}

export function Card({ id, ...rest }: CardProps) {
  return (
    <Token id={id} {...rest}>
      <Box surface="wash" border className="aspect-[2/3]">
        <Box className="flex flex-col items-center justify-center h-full m-auto text-xl">
          <Box className="font-bold">{getCardRank(id)}</Box>
          <Box className="text-gray-dark">{getCardSuit(id)}</Box>
        </Box>
        <Box className="absolute top-1 right-1 text-xs text-gray-dark">
          {getCardSuit(id)}
        </Box>
        <Box className="absolute bottom-1 left-1 text-xs text-gray-dark">
          {getCardRank(id)}
        </Box>
      </Box>
    </Token>
  );
}
