import { statusData } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';

export function PlayerStatus({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <span className="text-red-500">Unknown Player</span>;
  }

  const {
    statusIds: { injured, streak: streakStacks },
  } = player;

  return (
    <div className="flex flex-row items-center gap-2">
      {injured && <span>{statusData.injured.icon}</span>}
      {streakStacks &&
        statusData.streak.condition({ isMe: true, stacks: streakStacks }) && (
          <span>{statusData.streak.icon(streakStacks)}</span>
        )}
    </div>
  );
}
