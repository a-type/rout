import {
  Box,
  BoxProps,
  clsx,
  Icon,
  IconName,
  withClassName,
  withProps,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { CSSProperties } from 'react';
import { PlayerAvatar } from '../players/PlayerAvatar';

export type PlayingCardSuit = 'h' | 'd' | 'c' | 's';

export interface PlayingCardProps {
  cardSuit: PlayingCardSuit;
  cardRank: number;
  playerId?: PrefixedId<'u'>;
  className?: string;
  /** Doesn't do anything to events, but styles the card to appear disabled. */
  disabled?: boolean;
}

const suitToIcon: Record<PlayingCardSuit, IconName> = {
  h: 'suitHeart',
  d: 'suitDiamond',
  c: 'suitClub',
  s: 'suitSpade',
};

function PlayingCardRoot({
  cardSuit,
  cardRank,
  disabled,
  playerId,
  className,
  ...rest
}: PlayingCardProps) {
  return (
    <CardRoot
      data-color={getCardColor(cardSuit)}
      data-suit={cardSuit}
      data-disabled={disabled}
      className={clsx('playing-card', className)}
      {...rest}
    >
      <ExtremelySimpleCardContent cardSuit={cardSuit} cardRank={cardRank} />
      <SimpleCardContent cardSuit={cardSuit} cardRank={cardRank} />
      <DetailedCardContent cardSuit={cardSuit} cardRank={cardRank} />
      {playerId && (
        <PlayerAvatar
          playerId={playerId}
          className="absolute top-sm right-sm"
        />
      )}
    </CardRoot>
  );
}

function ExtremelySimpleCardContent({
  cardSuit,
  cardRank,
}: {
  cardSuit: PlayingCardSuit;
  cardRank: number;
}) {
  return (
    <Box
      d="col"
      layout="center center"
      full
      p="xs"
      className="flex @[40px]:hidden rounded-xs"
      surface="default"
      border
    >
      <CardNumber cardRank={cardRank} />
      <CardSuitIcon cardSuit={cardSuit} />
    </Box>
  );
}

function SimpleCardContent({
  cardSuit,
  cardRank,
}: {
  cardSuit: PlayingCardSuit;
  cardRank: number;
}) {
  return (
    <Box
      d="col"
      layout="center center"
      full
      p="xs"
      className="hidden @[40px]:flex @[80px]:hidden rounded-sm"
      surface="default"
      border
    >
      <Box d="col" className="absolute left-2px top-2px">
        <CardNumber cardRank={cardRank} className="mr-auto" />
        <CardSuitIcon cardSuit={cardSuit} />
      </Box>
      <Box d="col" className="absolute right-2px bottom-2px rotate-180">
        <CardNumber cardRank={cardRank} className="ml-auto" />
        <CardSuitIcon cardSuit={cardSuit} />
      </Box>
    </Box>
  );
}

const symbolPatterns = [
  // 1
  [{ x: 0.5, y: 0.5 }],
  // 2
  [
    { x: 0.5, y: 0.25 },
    { x: 0.5, y: 0.75 },
  ],
  // 3
  [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.25 },
    { x: 0.5, y: 0.75 },
  ],
  // 4
  [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  // 5
  [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
    { x: 0.5, y: 0.5 },
  ],
  // 6
  [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  // 7
  [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
    { x: 0.5, y: 0.35 },
  ],
  // 8
  [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
  ],
  // 9
  [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.4 },
    { x: 0.75, y: 0.4 },
    { x: 0.25, y: 0.6 },
    { x: 0.75, y: 0.6 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
    { x: 0.5, y: 0.5 },
  ],
  // 10
  [
    { x: 0.25, y: 0.2 },
    { x: 0.75, y: 0.2 },
    { x: 0.25, y: 0.4 },
    { x: 0.75, y: 0.4 },
    { x: 0.25, y: 0.6 },
    { x: 0.75, y: 0.6 },
    { x: 0.25, y: 0.8 },
    { x: 0.75, y: 0.8 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
  ],
];

function DetailedCardContent({
  cardSuit,
  cardRank,
}: {
  cardSuit: PlayingCardSuit;
  cardRank: number;
}) {
  let symbolCount = cardRank;
  if (symbolCount > 10) {
    symbolCount = 1;
  }

  const pattern = symbolPatterns[symbolCount - 1];
  return (
    <Box
      layout="center center"
      full
      d="col"
      surface="default"
      border
      className="hidden @[80px]:flex"
    >
      <NumberSuitStack className="top-0 left-0">
        <CardNumber cardRank={cardRank} />
        <CardSuitIcon cardSuit={cardSuit} />
      </NumberSuitStack>
      <NumberSuitStack className="bottom-0 right-0">
        <CardSuitIcon cardSuit={cardSuit} className="rotate-180" />
        <CardNumber cardRank={cardRank} className="rotate-180" />
      </NumberSuitStack>
      <Box className="flex-1 inset-16px absolute">
        {pattern.map((pos, index) => (
          <CardSymbol
            key={index}
            cardSuit={cardSuit}
            cardRank={cardRank}
            className="absolute flex-grow-0"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: `${Math.max(15, 80 / symbolCount)}%`,
              height: 'auto',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

const NumberSuitStack = withClassName(
  'div',
  'p-sm flex flex-col items-center justify-center absolute h-25% w-20% min-h-50px min-w-40px',
);

export function PlayingCardPlaceholder({
  children,
  className,
  ...rest
}: BoxProps) {
  return (
    <CardRoot
      className={clsx('opacity-50', className)}
      container="reset"
      data-disabled
      {...rest}
    >
      <Box
        border
        full
        className="border-dashed @[40px]:rounded-sm @[80px]:rounded-lg rounded-xs"
      >
        {children}
      </Box>
    </CardRoot>
  );
}

export const PlayingCard = Object.assign(PlayingCardRoot, {
  Placeholder: PlayingCardPlaceholder,
});

const CardRoot = withClassName(
  withProps(Box, { container: 'reset' }),
  'aspect-[3/4] flex-1 h-auto min-w-24px min-h-32px max-h-50vh select-none @container',
  '[&[data-suit=s]]:(color-black)',
  '[&[data-suit=c]]:(color-gray-dark color-darken-4)',
  '[&[data-suit=h]]:(color-attention-ink)',
  '[&[data-suit=d]]:(color-attention-dark color-lighten-1)',
);

function ScalingText({
  children,
  className,
  style,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={clsx('flex-1', className)}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...rest}
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="font-bold"
        fontSize="80"
        fill="currentColor"
      >
        {children}
      </text>
    </svg>
  );
}

function CardNumber({
  cardRank,
  className,
}: {
  cardRank: number;
  className?: string;
}) {
  return (
    <ScalingText
      className={clsx(
        '[.playing-card[data-disabled=true]_&]:opacity-50',
        className,
      )}
    >
      {toDisplayRank(cardRank)}
    </ScalingText>
  );
}

function CardSuitIcon({
  cardSuit,
  className,
  style,
}: {
  cardSuit: PlayingCardSuit;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Icon
      name={suitToIcon[cardSuit]}
      className={clsx(
        'flex-1 stroke-width-1px min-w-20px w-auto h-auto aspect-1 [vector-effect:non-scaling-stroke] fill-[currentColor]',
        '[.playing-card[data-disabled=true]_&]:opacity-50',
        className,
      )}
      style={style}
    />
  );
}

function CardSymbol({
  className,
  style,
  cardSuit,
  cardRank,
}: {
  cardRank: number;
  cardSuit: PlayingCardSuit;
  className?: string;
  style?: CSSProperties;
}) {
  if (cardRank <= 10) {
    return (
      <CardSuitIcon cardSuit={cardSuit} className={className} style={style} />
    );
  }
  return (
    <ScalingText
      className={clsx(
        '[.playing-card[data-disabled=true]_&]:opacity-50',
        className,
      )}
      style={style}
    >
      {toDisplayRank(cardRank)}
    </ScalingText>
  );
}

function getCardColor(suit: PlayingCardSuit): 'red' | 'black' {
  return suit === 'h' || suit === 'd' ? 'red' : 'black';
}
function toDisplayRank(rank: number): string {
  if (rank === 1 || rank === 14) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return rank.toString();
}
