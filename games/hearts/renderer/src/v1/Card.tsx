import { Box, withClassName, withProps } from '@a-type/ui';
import {
  Card as CardVal,
  getCardColor,
  getCardDisplayRank,
  getCardSuit,
} from '@long-game/game-hearts-definition/v1';
import { Token, TokenProps } from '@long-game/game-ui';

export interface CardProps extends Omit<TokenProps, 'id'> {
  id: CardVal;
}

export function Card({ id, ...rest }: CardProps) {
  return (
    <CardRoot asChild data-color={getCardColor(id)}>
      <Token id={id} {...rest}>
        <Box className="flex flex-col items-center justify-center h-full m-auto text-xl">
          <Box className="font-bold">{getCardDisplayRank(id)}</Box>
          <Box className="text-gray-dark">{getCardSuit(id)}</Box>
        </Box>
      </Token>
    </CardRoot>
  );
}

export function CardPlaceholder({ children }: { children?: React.ReactNode }) {
  return (
    <CardRoot
      className="opacity-50 border-dashed"
      container="reset"
      data-disabled
    >
      {children}
    </CardRoot>
  );
}

const CardRoot = withClassName(
  withProps(Box, { surface: 'wash', border: true }),
  'aspect-[3/4] flex-1 h-auto min-w-100px select-none',
  '[&:not([data-disabled=true])]:(hover:cursor-grab)',
  '[&[data-color=black]]:(color-black)',
  '[&[data-color=red]]:(color-attention-ink)',
);
