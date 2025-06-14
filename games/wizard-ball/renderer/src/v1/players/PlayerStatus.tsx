import { statusData } from '@long-game/game-wizard-ball-definition';
import { hooks } from '../gameClient';
import { strOrFn } from '../perks/StatusChip';

export function PlayerStatus({ id }: { id: string }) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  if (!player) {
    return <span className="text-red-500">Unknown Player</span>;
  }

  const {
    statusIds: { injured, streak: streakStacks, ...other },
  } = player;

  return (
    <div className="flex flex-row items-center gap-0">
      {injured && <span>{statusData.injured.icon}</span>}
      {streakStacks &&
        statusData.streak.condition({ isMe: true, stacks: streakStacks }) && (
          <span>{statusData.streak.icon(streakStacks)}</span>
        )}
      {Object.entries(other).map(([id, stacks]) => {
        const status = statusData[id as keyof typeof statusData];
        if (!status || !status.condition?.({ isMe: true, stacks })) {
          return null;
        }
        return (
          <span key={id} title={strOrFn(status.name, stacks)}>
            {strOrFn(status.icon, stacks)}
          </span>
        );
      })}
    </div>
  );
}
