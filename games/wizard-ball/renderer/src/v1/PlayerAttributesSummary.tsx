import {
  getPlayerOverall,
  Player,
} from '@long-game/game-wizard-ball-definition';
import { hooks } from './gameClient';
import { attributeToColor } from './utils';

const attributes = [
  { key: 'strength', label: 'STR' },
  { key: 'agility', label: 'AGI' },
  { key: 'constitution', label: 'CON' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'intelligence', label: 'INT' },
  { key: 'charisma', label: 'CHA' },
] as const satisfies Array<{
  key: keyof Player['attributes'];
  label: string;
}>;

export function PlayerAttributesSummary({
  id,
  overallOnly,
}: {
  id: string;
  overallOnly?: boolean;
}) {
  const { finalState } = hooks.useGameSuite();
  const player = finalState.league.playerLookup[id];
  const attr = player.attributes;
  const overall = getPlayerOverall(player);

  if (overallOnly) {
    return (
      <div
        className="flex flex-row gap-2 items-center bg-gray-800 p-1 rounded"
        style={{ color: attributeToColor(overall, 120).text }}
      >
        <span className="font-bold">OVR:</span>
        <span>{overall}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2">
      {attributes.map((a) => (
        <div
          key={a.key}
          className="flex flex-row gap-2 items-center bg-gray-800 p-1 rounded"
        >
          <span className="font-bold">{a.label}:</span>
          <span>{attr[a.key]}</span>
        </div>
      ))}
    </div>
  );
}
