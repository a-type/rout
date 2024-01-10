import { Divider } from '@a-type/ui/components/divider';
import { H1 } from '@a-type/ui/components/typography';
import { GameSessionData, globalHooks } from '@long-game/game-client';
import games from '@long-game/games';
import { Suspense } from 'react';
import { NoGameFound } from './NoGameFound.jsx';

export interface GameRecapProps {
  gameSession: GameSessionData;
}

export function GameRecap({ gameSession }: GameRecapProps) {
  return (
    <div>
      <H1>Game Recap</H1>
      <div>The game has ended!</div>
      <RecapDetails gameSession={gameSession} />
    </div>
  );
}

function RecapDetails({ gameSession }: { gameSession: GameSessionData }) {
  const game = games[gameSession.gameId];

  if (!game) {
    return <NoGameFound />;
  }

  const gameDefinition = game.versions.find(
    (g) => g.version === gameSession.gameVersion,
  );

  if (!gameDefinition) {
    return <NoGameFound />;
  }
  const { GameRecap } = gameDefinition;

  const { data: postGameData } = globalHooks.gameSessions.postGame.useQuery({
    gameSessionId: gameSession.id,
  });

  if (!postGameData) {
    return null;
  }

  return (
    <>
      <Winners
        gameSession={gameSession}
        winnerIds={postGameData?.winnerIds ?? []}
      />
      <Divider />
      <Suspense>
        <GameRecap
          session={gameSession}
          globalState={postGameData?.globalState}
        />
      </Suspense>
    </>
  );
}

function Winners({
  gameSession,
  winnerIds,
}: {
  gameSession: GameSessionData;
  winnerIds: string[];
}) {
  const winners = gameSession.members.filter((member) =>
    winnerIds.includes(member.id),
  );
  return (
    <div>
      <div>Winners:</div>
      {winners.map((winner) => (
        <div key={winner.id}>{winner.name}</div>
      ))}
    </div>
  );
}
