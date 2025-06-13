import { hooks } from '../gameClient';

export function PlayerStatus({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <span className="text-red-500">Unknown Player</span>;
  }

  const {
    statusIds: { injured, hot, cold },
  } = player;

  return (
    <div className="flex flex-row items-center gap-2">
      {injured && <span className="text-red-500">💔</span>}
      {hot && <span className="text-yellow-500">🔥</span>}
      {cold && <span className="text-blue-500">❄️</span>}
    </div>
  );
}
