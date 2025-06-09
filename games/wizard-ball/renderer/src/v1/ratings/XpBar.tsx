import {
  getLevelFromXp,
  getXpForLevel,
} from '@long-game/game-wizard-ball-definition';
import { Bar } from './Bar';

export function XpBar({ xp }: { xp: number }) {
  const { level, xp: remainingXp } = getLevelFromXp(xp);
  const xpForNextlevel = getXpForLevel(level + 1);
  return (
    <div className="flex flex-row gap-2 items-center max-w-[400px]">
      <span className="whitespace-nowrap">LVL {level}</span>
      <Bar minValue={remainingXp} range={xpForNextlevel} color="magenta" />
      <span className="whitespace-nowrap">
        {remainingXp} / {xpForNextlevel}
      </span>
    </div>
  );
}
