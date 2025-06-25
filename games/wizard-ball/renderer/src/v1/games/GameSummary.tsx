import { useGameResults } from '../useGameResults';
import { GameScoreboard } from './GameScoreboard';
import { GameLogEvent } from './GameLog';

export function GameSummary({ id }: { id: string }) {
  const game = useGameResults({ id });
  if (!game) {
    return <div>Game not found</div>;
  }
  const log =
    game.gameLog
      ?.filter(
        (ev) =>
          ('runsScored' in ev && ev.runsScored > 0) ||
          ev.kind === 'inningStart' ||
          ev.kind === 'injury' ||
          ('important' in ev && ev.important),
      )
      .filter((ev, idx, arr) => {
        if (ev.kind === 'inningStart') {
          return arr[idx + 1] && arr[idx + 1].kind !== 'inningStart';
        }
        return true;
      }) ?? [];
  return (
    <>
      <GameScoreboard id={id} />
      {log.map((entry, index) => (
        <div key={index} className="p-1">
          <GameLogEvent event={entry} />
        </div>
      ))}
    </>
  );
}
