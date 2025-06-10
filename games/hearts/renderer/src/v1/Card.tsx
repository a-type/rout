import { Box, Icon, IconName, withClassName, withProps } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  Card as CardVal,
  getCardColor,
  getCardDisplayRank,
  getCardSuit,
} from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar } from '@long-game/game-ui';

export interface CardProps {
  id: CardVal;
  playerId?: PrefixedId<'u'>;
  className?: string;
}

const suitToIcon: Record<string, IconName> = {
  h: 'suitHeart',
  d: 'suitDiamond',
  c: 'suitClub',
  s: 'suitSpade',
};

export function Card({ id, playerId, ...rest }: CardProps) {
  return (
    <CardRoot
      data-color={getCardColor(id)}
      data-suit={getCardSuit(id)}
      {...rest}
    >
      <Box className="flex flex-col items-center justify-center h-full m-auto text-xl">
        <CardNumber id={id} />
        <Icon
          name={suitToIcon[getCardSuit(id)]}
          className="flex-1 stroke-width-1px min-w-20px w-auto h-auto aspect-1 [vector-effect:non-scaling-stroke]"
        />
      </Box>
      {playerId && (
        <PlayerAvatar
          playerId={playerId}
          className="absolute top-md right-md"
        />
      )}
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
  'aspect-[3/4] flex-1 h-auto min-w-40px min-h-50px  select-none',
  '[&[data-suit=s]]:(color-black)',
  '[&[data-suit=c]]:(color-gray-dark color-darken-4)',
  '[&[data-suit=h]]:(color-attention-ink)',
  '[&[data-suit=d]]:(color-attention color-darken-4)',
);

function CardNumber({ id }: { id: CardVal }) {
  return (
    <svg
      className="flex-1"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="font-bold"
        fontSize="40"
        fill="currentColor"
      >
        {getCardDisplayRank(id)}
      </text>
    </svg>
  );
}
