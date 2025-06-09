import { hooks } from './gameClient';
import { PlayerChip } from './players/PlayerChip';
import { PlayerLevel } from './players/PlayerLevel';
import { PlayerName } from './players/PlayerName';

export function Levelups() {
  const { finalState, localTurnData } = hooks.useGameSuite();
  const levelups = finalState.levelups;

  if (Object.keys(levelups).length === 0) {
    return <span className="text-sm font-semibold">No level-ups</span>;
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <h4 className="text-lg font-bold mt-0 mb-2">Level-ups</h4>
      {Object.keys(levelups).map((pid) => (
        <div
          key={pid}
          className="inline-flex flex-row items-center gap-2 bg-gray-500/30 p-2 rounded"
        >
          {localTurnData?.levelupChoices?.[pid]?.length ===
            levelups[pid].length && (
            <span className="text-sm text-green-500">Chosen ✓</span>
          )}
          <PlayerChip id={pid} />
          reached <PlayerLevel id={pid} /> and has a boon pick available!
        </div>
      ))}
    </div>
  );
}
