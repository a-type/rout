import { Link } from 'react-router';
import { hooks } from './gameClient';
import { PlayerChip } from './players/PlayerChip';
import { PlayerLevel } from './players/PlayerLevel';

export function Levelups() {
  const { finalState, currentTurn } = hooks.useGameSuite();
  const levelups = finalState.levelups;

  if (Object.keys(levelups).length === 0) {
    return <span className="text-sm font-semibold">No level-ups</span>;
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <h4 className="text-lg font-bold mt-0 mb-2">Level-ups</h4>
      {Object.keys(levelups).map((pid) => (
        <Link
          key={pid}
          to={{
            search: `?playerId=${pid}`,
          }}
        >
          <div className="inline-flex flex-col md:flex-row items-center gap-2 bg-gray/30 p-2 rounded">
            {currentTurn?.levelupChoices?.[pid]?.length ===
              levelups[pid].length && (
              <span className="text-sm color-accent-dark">Chosen ✓</span>
            )}
            <PlayerChip includeClass includeSpecies noTeamIcon id={pid} />
            reached <PlayerLevel id={pid} /> and has a boon pick available!
          </div>
        </Link>
      ))}
    </div>
  );
}
