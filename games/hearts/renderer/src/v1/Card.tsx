import {
  Box,
  clsx,
  Icon,
  IconName,
  withClassName,
  withProps,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  Card as CardVal,
  getCardColor,
  getCardDisplayRank,
  getCardRank,
  getCardSuit,
} from '@long-game/game-hearts-definition/v1';
import { PlayerAvatar } from '@long-game/game-ui';

export interface CardProps {
  id: CardVal;
  playerId?: PrefixedId<'u'>;
  className?: string;
  variant?: 'simple' | 'detailed';
}

const suitToIcon: Record<string, IconName> = {
  h: 'suitHeart',
  d: 'suitDiamond',
  c: 'suitClub',
  s: 'suitSpade',
};

export function Card({ id, playerId, variant = 'simple', ...rest }: CardProps) {
  return (
    <CardRoot
      data-color={getCardColor(id)}
      data-suit={getCardSuit(id)}
      {...rest}
    >
      {variant === 'simple' ? (
        <SimpleCardContent id={id} />
      ) : (
        <DetailedCardContent id={id} />
      )}
      {playerId && (
        <PlayerAvatar
          playerId={playerId}
          className="absolute top-md right-md"
        />
      )}
    </CardRoot>
  );
}

function SimpleCardContent({ id }: { id: CardVal }) {
  return (
    <Box className="flex flex-col items-center justify-center h-full m-auto text-xl">
      <CardNumber id={id} />
      <Icon
        name={suitToIcon[getCardSuit(id)]}
        className="flex-1 stroke-width-1px min-w-20px w-auto h-auto aspect-1 [vector-effect:non-scaling-stroke]"
      />
    </Box>
  );
}

const symbolPatterns = [
  [{ x: 0.5, y: 0.5 }],
  [
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.8 },
  ],
  [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.8 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
    { x: 0.5, y: 0.5 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.5 },
    { x: 0.8, y: 0.5 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.5 },
    { x: 0.8, y: 0.5 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
    { x: 0.5, y: 0.35 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.5 },
    { x: 0.8, y: 0.5 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.4 },
    { x: 0.8, y: 0.4 },
    { x: 0.2, y: 0.6 },
    { x: 0.8, y: 0.6 },
    { x: 0.5, y: 0.8 },
    { x: 0.5, y: 0.8 },
    { x: 0.5, y: 0.5 },
  ],
  [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.4 },
    { x: 0.8, y: 0.4 },
    { x: 0.2, y: 0.6 },
    { x: 0.8, y: 0.6 },
    { x: 0.5, y: 0.8 },
    { x: 0.5, y: 0.8 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
  ],
];

function DetailedCardContent({ id }: { id: CardVal }) {
  const suit = getCardSuit(id);
  let symbolCount = getCardRank(id);
  if (symbolCount > 10) {
    symbolCount = 1;
  }

  const pattern = symbolPatterns[symbolCount - 1];
  return (
    <Box className="flex flex-col items-center justify-center h-full m-auto">
      <Box d="col" className="absolute top-0 left-0">
        <CardNumber id={id} className="" />
        <CardSuitIcon id={id} />
      </Box>
      <Box d="col" className="absolute bottom-0 right-0">
        <CardNumber id={id} className="rotate-180" />
        <CardSuitIcon id={id} className="rotate-180" />
      </Box>
      <Box className="flex-1 w-full h-full absolute">
        {pattern.map((pos, index) => (
          <Icon
            key={index}
            name={suitToIcon[suit]}
            className="absolute"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </Box>
    </Box>
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
  'aspect-[3/4] flex-1 h-auto min-w-40px min-h-50px max-h-50vh select-none',
  '[&[data-suit=s]]:(color-black)',
  '[&[data-suit=c]]:(color-gray-dark color-darken-4)',
  '[&[data-suit=h]]:(color-attention-ink)',
  '[&[data-suit=d]]:(color-attention color-darken-4)',
);

function CardNumber({ id, className }: { id: CardVal; className?: string }) {
  return (
    <svg
      className={clsx('flex-1', className)}
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

function CardSuitIcon({ id, className }: { id: CardVal; className?: string }) {
  const suit = getCardSuit(id);
  return (
    <Icon
      name={suitToIcon[suit]}
      className={clsx(
        'w-20px h-20px stroke-width-1px [vector-effect:non-scaling-stroke]',
        className,
      )}
      style={{ color: getCardColor(id) }}
    />
  );
}
