import { Box, BoxProps, clsx, Icon, IconName, withClassName } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { CSSProperties, memo } from 'react';
import { PlayerAvatar } from '../players/PlayerAvatar.js';
import cls from './PlayingCard.module.css';

export type PlayingCardSuit = 'h' | 'd' | 'c' | 's';

export interface PlayingCardProps {
  cardSuit: PlayingCardSuit;
  cardRank: number;
  playerId?: PrefixedId<'u'>;
  className?: string;
  style?: CSSProperties;
  /** Doesn't do anything to events, but styles the card to appear disabled. */
  disabled?: boolean;
  size?: string | number;
}

const suitToIcon: Record<PlayingCardSuit, IconName> = {
  h: 'suitHeart',
  d: 'suitDiamond',
  c: 'suitClub',
  s: 'suitSpade',
};

const PlayingCardRoot = memo(function PlayingCardRoot({
  cardSuit,
  cardRank,
  disabled,
  playerId,
  className,
  size,
  style: userStyle,
  ...rest
}: PlayingCardProps) {
  const color = getCardColor(cardSuit);
  const sizeStyle = size ? { width: size, ...userStyle } : userStyle;
  return (
    <CardRoot
      data-color={color}
      data-suit={cardSuit}
      data-disabled={disabled}
      className={clsx(
        'playing-card',
        `@mode-${color === 'red' ? 'tomato' : 'neutral'}`,
        className,
      )}
      style={sizeStyle}
      {...rest}
    >
      <ExtremelySimpleCardContent cardSuit={cardSuit} cardRank={cardRank} />
      <SimpleCardContent cardSuit={cardSuit} cardRank={cardRank} />
      <DetailedCardContent cardSuit={cardSuit} cardRank={cardRank} />
      {disabled && <Slash />}
      {playerId && <PlayerAvatar playerId={playerId} className={cls.avatar} />}
    </CardRoot>
  );
});

function ExtremelySimpleCardContent({
  cardSuit,
  cardRank,
}: {
  cardSuit: PlayingCardSuit;
  cardRank: number;
}) {
  return (
    <Box col layout="center center" full className={cls.extremelySimple} border>
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
    <Box col layout="center center" full p="xs" className={cls.simple} border>
      <Box col className={cls.indicatorTL}>
        <CardNumber cardRank={cardRank} className="mr-auto" />
        <CardSuitIcon cardSuit={cardSuit} />
      </Box>
      <Box col className={cls.indicatorBR}>
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
    <Box layout="center center" full col border className={cls.detailed}>
      <NumberSuitStack className={cls.indicatorTL}>
        <CardNumber cardRank={cardRank} />
        <CardSuitIcon cardSuit={cardSuit} />
      </NumberSuitStack>
      <NumberSuitStack className={cls.indicatorBR}>
        <CardNumber cardRank={cardRank} />
        <CardSuitIcon cardSuit={cardSuit} />
      </NumberSuitStack>
      <Box grow className={cls.detailedCenter}>
        {pattern.map((pos, index) => (
          <CardSymbol
            key={index}
            cardSuit={cardSuit}
            cardRank={cardRank}
            className={cls.detailedSymbol}
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

const NumberSuitStack = withClassName('div', cls.suitStack);

export function PlayingCardPlaceholder({
  children,
  className,
  size,
  style: userStyle,
  ...rest
}: BoxProps & { size?: string | number }) {
  const sizeStyle = size ? { width: size, ...userStyle } : userStyle;
  return (
    <CardRoot
      className={clsx(className, cls.placeholderRoot)}
      style={sizeStyle}
      container
      data-disabled
      {...rest}
    >
      <Box border full className={cls.placeholder}>
        {children}
      </Box>
    </CardRoot>
  );
}

export const PlayingCard = Object.assign(PlayingCardRoot, {
  Placeholder: PlayingCardPlaceholder,
});

const CardRoot = withClassName(Box, cls.cardRoot);

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
      className={clsx(cls.text, className)}
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
    <ScalingText className={clsx(cls.generalSymbol, className)}>
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
      className={clsx(cls.generalSymbol, cls.suitIcon, className)}
      vectorEffect="non-scaling-stroke"
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
    <ScalingText className={clsx(cls.generalSymbol, className)} style={style}>
      {toDisplayRank(cardRank)}
    </ScalingText>
  );
}

function Slash() {
  return (
    <svg className={cls.slash} viewBox="0 0 100 100">
      <line
        x1="90"
        y1="-10"
        x2="10"
        y2="110"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
