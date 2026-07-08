import { GameSessionStatusChip } from '@/components/memberships/GameSessionStatusChip.js';
import {
  Box,
  Button,
  clsx,
  SlotDiv,
  withClassName,
  withProps,
} from '@a-type/ui';
import { GameSession } from '@long-game/game-client';
import { Link } from '@verdant-web/react-router';
import {
  createContext,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  Suspense,
  useContext,
} from 'react';
import { GameIcon } from '../GameIcon.js';
import { GameTitle } from '../GameTitle.js';
import cls from './GameSummaryCard.module.css';

export interface GameSummaryCardProps {
  session: Pick<GameSession, 'id' | 'gameId' | 'status' | 'canDelete'>;
  hotseat?: boolean;
  className?: string;
}

const GameSummaryCardContext = createContext<{
  session: GameSummaryCardProps['session'];
  hotseat: boolean;
} | null>(null);
function useGameCardSummaryContext() {
  const context = useContext(GameSummaryCardContext);
  if (!context) {
    throw new Error(
      'useGameCardSummaryContext must be used within a GameSummaryCard',
    );
  }
  return context;
}

function Skeleton() {
  return <Box surface />;
}

export function GameSummaryCardRoot({
  session,
  hotseat = false,
  className,
  children,
  ...rest
}: PropsWithChildren<GameSummaryCardProps>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <GameSummaryCardContext.Provider value={{ session, hotseat }}>
        <div
          className={clsx(cls.root, className)}
          style={{
            anchorName: `--${session.id}`,
          }}
          {...rest}
        >
          {children}
        </div>
      </GameSummaryCardContext.Provider>
    </Suspense>
  );
}

export const GameSummaryCardDetails = withClassName(
  withProps(Box, {
    col: true,
    p: 'md',
    gap: 'sm',
    surface: true,
    border: true,
  }),
  cls.details,
);

function GameSummaryCardTitle() {
  const { session } = useGameCardSummaryContext();
  if (session.gameId) {
    return <GameTitle gameId={session.gameId} />;
  }
  return <div>Choosing game...</div>;
}

export function GameSummaryCardTrigger({ children }: { children?: ReactNode }) {
  const { session, hotseat } = useGameCardSummaryContext();
  return (
    <Button
      size="wrapper"
      emphasis="ghost"
      render={<Link to={`/${hotseat ? 'hotseat' : 'session'}/${session.id}`} />}
      className={cls.trigger}
    >
      {children}
    </Button>
  );
}

export function GameSummaryCardIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const { session } = useGameCardSummaryContext();

  return (
    <GameIcon
      gameId={session.gameId}
      style={
        {
          ...style,
          positionAnchor: `--${session.id}`,
          top: 'calc(anchor(top) + (anchor-size(height) * 1 / 2))',
          left: 'calc(anchor(left) + (anchor-size(width) * 3 / 4))',
          width: 'calc(anchor-size(height) * 5 / 4)',
        } as any
      }
      className={clsx(cls.icon, className)}
    />
  );
}

function GameSummaryCardStatus() {
  const { session } = useGameCardSummaryContext();
  return <GameSessionStatusChip status={session.status} />;
}

export const GameSummaryCardMenu = withClassName(SlotDiv, cls.menu);

const GameSummaryCardGrid = withClassName(SlotDiv, cls.grid);

export const GameSummaryCard = Object.assign(GameSummaryCardRoot, {
  Details: GameSummaryCardDetails,
  Title: GameSummaryCardTitle,
  Trigger: GameSummaryCardTrigger,
  Icon: GameSummaryCardIcon,
  Menu: GameSummaryCardMenu,
  Status: GameSummaryCardStatus,
  Grid: GameSummaryCardGrid,
  Skeleton,
});
