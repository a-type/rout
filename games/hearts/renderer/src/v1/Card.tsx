import { Box, Icon, IconName, withClassName, withProps } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  Card as CardVal,
  getCardColor,
  getCardDisplayRank,
  getCardSuit,
} from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar, Token, TokenProps } from '@long-game/game-ui';

export interface CardProps extends Omit<TokenProps, 'id'> {
  id: CardVal;
  playerId?: PrefixedId<'u'>;
}

const suitToIcon: Record<string, IconName> = {
  h: 'suitHeart',
  d: 'suitDiamond',
  c: 'suitClub',
  s: 'suitSpade',
};

export function Card({ id, playerId, ...rest }: CardProps) {
  return (
    <CardRoot asChild data-color={getCardColor(id)} data-suit={getCardSuit(id)}>
      <Token id={id} {...rest}>
        <Box className="flex flex-col items-center justify-center h-full m-auto text-xl">
          <Box className="font-bold">{getCardDisplayRank(id)}</Box>
          <Box>
            <Icon
              name={suitToIcon[getCardSuit(id)]}
              size={80}
              className="stroke-width-1px [vector-effect:non-scaling-stroke]"
            />
          </Box>
        </Box>
        {playerId && (
          <PlayerAvatar
            playerId={playerId}
            className="absolute top-md right-md"
          />
        )}
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
  withProps(Box, { surface: 'default', container: 'reset', border: true }),
  'aspect-[3/4] flex-1 h-auto min-w-100px select-none',
  '[&:not([data-disabled=true])]:(hover:cursor-grab)',
  '[&[data-suit=s]]:(color-black)',
  '[&[data-suit=c]]:(color-gray-dark color-darken-4)',
  '[&[data-suit=h]]:(color-attention-ink)',
  '[&[data-suit=d]]:(color-attention color-darken-4)',
);
