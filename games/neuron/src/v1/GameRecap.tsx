import { ClientSession } from '@long-game/game-definition';
import { GlobalState, getPlayerScores } from './gameDefinition.js';
import { Grid } from './components/Grid.js';
import { GameClientProvider } from './gameClient.js';
import { Avatar } from '@a-type/ui/components/avatar';

export interface GameRecapProps {
  session: ClientSession;
  globalState: GlobalState;
}

export function GameRecap({ session, globalState }: GameRecapProps) {
  const playerScores = getPlayerScores(globalState);
  return (
    <div>
      <GameClientProvider session={session}>
        {Object.entries(playerScores).map(([userId, score]) => (
          <PlayerScore
            key={userId}
            userId={userId}
            score={score}
            session={session}
          />
        ))}
        <Grid data={globalState.grid} />
      </GameClientProvider>
    </div>
  );
}

function PlayerScore({
  userId,
  score,
  session,
}: {
  userId: string;
  score: number;
  session: ClientSession;
}) {
  const member = session.members.find((m) => m.id === userId);

  return (
    <div className="flex flex-row items-center gap-2">
      <Avatar imageSrc={member?.imageUrl ?? undefined} />
      {member?.name ?? 'unknown'}: {score}
    </div>
  );
}

export default GameRecap;
