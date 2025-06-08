import {
  getLevelFromXp,
  getXpForLevel,
} from '@long-game/game-wizard-ball-definition';
import { Bar } from './Bar';

export function XpBar({ xp }: { xp: number }) {
  const level = getLevelFromXp(xp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpRemaining = getXpForLevel(level + 1) - xpForCurrentLevel;
  return (
    <div className="flex flex-row gap-2 items-center max-w-[400px]">
      <span className="whitespace-nowrap">LVL {level}</span>
      <Bar
        minValue={xp - xpForCurrentLevel}
        range={xp + xpRemaining}
        color="magenta"
      />
    </div>
  );
}
