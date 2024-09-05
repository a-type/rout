import { Divider } from '@a-type/ui/components/divider';
import { H1 } from '@a-type/ui/components/typography';
import games from '@long-game/games';
import { Suspense } from 'react';
import { NoGameFound } from './NoGameFound.jsx';
import {
  FragmentOf,
  graphql,
  readFragment,
  useSuspenseQuery,
} from '@long-game/game-client';
import { clientSessionFragment } from '../../../../../packages/game-definition/src/fragments.js';

export const postGameSessionFragment = graphql(
  `
    fragment PostGameSessionFragment on GameSession {
      id
      gameId
      gameVersion
      members {
        id
        user {
          id
          name
          imageUrl
          color
        }
      }
      postGame {
        globalState
        winnerIds
      }
      ...GameDefinitionClientSession
    }
  `,
  [clientSessionFragment],
);

export interface GameRecapProps {
  gameSession: FragmentOf<typeof postGameSessionFragment>;
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

function RecapDetails({
  gameSession,
}: {
  gameSession: FragmentOf<typeof postGameSessionFragment>;
}) {
  const postGameData = readFragment(postGameSessionFragment, gameSession);

  const gameId = postGameData.gameId;
  const gameVersion = postGameData.gameVersion;

  const game = games[gameId];

  if (!game) {
    return <NoGameFound />;
  }

  const gameDefinition = game.versions.find((g) => g.version === gameVersion);

  if (!gameDefinition) {
    return <NoGameFound />;
  }
  const { GameRecap } = gameDefinition;

  if (!postGameData) {
    return null;
  }

  return (
    <>
      <Winners
        gameSession={gameSession}
        winnerIds={postGameData.postGame?.winnerIds ?? []}
      />
      <Divider />
      <Suspense>
        <GameRecap
          session={postGameData}
          globalState={postGameData.postGame?.globalState}
        />
      </Suspense>
    </>
  );
}

function Winners({
  gameSession,
  winnerIds,
}: {
  gameSession: FragmentOf<typeof postGameSessionFragment>;
  winnerIds: string[];
}) {
  const data = readFragment(postGameSessionFragment, gameSession);
  const winners = data.members.filter((member) =>
    winnerIds.includes(member.user.id),
  );
  return (
    <div>
      <div>Winners:</div>
      {winners.map((winner) => (
        <div key={winner.id}>{winner.user.name}</div>
      ))}
    </div>
  );
}
