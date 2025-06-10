import { Tooltip } from '@a-type/ui';
import {
  ballparkData,
  type BallparkType,
} from '@long-game/game-wizard-ball-definition';
import { PerkEffect } from './items/PerkEffect';
import { TooltipPlus } from './TooltipPlus';

export function BallparkChip({ id }: { id: BallparkType }) {
  const ballpark = ballparkData[id];

  if (!ballpark) {
    return <span className="text-red-500">Unknown ballpark</span>;
  }
  const { color, icon, name } = ballpark;
  return (
    <TooltipPlus
      content={
        <div className="flex flex-col gap-1">
          <span>{ballpark.description}</span>
          <PerkEffect effect={ballpark.effect({ isHome: true })} />
        </div>
      }
      className="bg-gray-700 text-gray-100 max-w-[400px]"
    >
      <span
        className="flex flex-row items-center bg-gray-700 border-solid border-1 p-1 rounded cursor-pointer hover:bg-gray-700"
        style={{
          borderColor: color,
          color: color,
        }}
      >
        {icon} {name}
      </span>
    </TooltipPlus>
  );
}
