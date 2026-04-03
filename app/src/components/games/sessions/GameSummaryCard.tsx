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
  PropsWithChildren,
  ReactNode,
  Suspense,
  useContext,
} from 'react';
import { GameIcon } from '../GameIcon.js';
import { GameTitle } from '../GameTitle.js';

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
          className={clsx('group relative p-xs overflow-visible', className)}
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
    container: 'reset',
    surface: true,
    border: true,
  }),
  'relative z-1 shadow-md',
  'transition-transform',
  'group-hover:-rotate-10 group-focus-within:-rotate-10',
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
      className={clsx('relative transition-all overflow-visible')}
    >
      {children}
    </Button>
  );
}

export function GameSummaryCardIcon() {
  const { session } = useGameCardSummaryContext();

  return (
    <GameIcon
      gameId={session.gameId}
      style={
        {
          positionAnchor: `--${session.id}`,
          top: 'calc(anchor(top) + (anchor-size(height) * 1 / 2))',
          left: 'calc(anchor(left) + (anchor-size(width) * 5 / 8))',
          width: 'calc(anchor-size(height) * 5 / 4)',
        } as any
      }
      className={clsx(
        'aspect-1',
        'object-cover border-solid border-default border-gray-dark rd-lg',
        'fixed transform -translate-1/2 rotate-30',
        'group-hover:(rotate-40 scale-105) group-focus-within:(rotate-40 scale-105) transition-all',
        'shadow-md',
      )}
    />
  );
}

function GameSummaryCardStatus() {
  const { session } = useGameCardSummaryContext();
  return <GameSessionStatusChip status={session.status} />;
}

export const GameSummaryCardMenu = withClassName(
  SlotDiv,
  'absolute bottom-sm right-sm group-hover:-rotate-30 transition-transform',
);

const GameSummaryCardGrid = withClassName(
  SlotDiv,
  'grid',
  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  'gap-md py-xl',
);

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
