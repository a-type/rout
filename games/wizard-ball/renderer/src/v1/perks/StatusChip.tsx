import { clsx } from '@a-type/ui';
import { statusData, StatusType } from '@long-game/game-wizard-ball-definition';
import { TooltipPlus } from '../TooltipPlus';
import { PerkEffect } from '../items/PerkEffect';

function strOrFn(
  x: string | ((stacks: number) => string),
  stacks: number,
): string {
  return typeof x === 'function' ? x(stacks) : x;
}

export function StatusChip({
  id,
  stacks = 0,
}: {
  id: StatusType;
  stacks?: number;
}) {
  const status = statusData[id];
  if (!status) {
    return <div className="p-2 text-red-500">Status not found</div>;
  }
  const { name, description, kind, icon, effect } = status;
  return (
    <TooltipPlus
      content={
        <div className="flex flex-col gap-1">
          <span className="flex flex-col gap-1">
            {strOrFn(description, stacks)}
            <PerkEffect effect={effect({ stacks })} />
          </span>
        </div>
      }
      className="bg-gray-700 text-gray-100"
    >
      <span
        className={clsx(
          'flex flex-row items-center bg-gray-800 border-solid border-1',
          'p-1 rounded cursor-pointer hover:bg-gray-700',
          (kind === 'buff') === stacks > 0 ? 'text-green-400' : 'text-red-400',
        )}
      >
        {strOrFn(icon, stacks)} {strOrFn(name, stacks)}{' '}
        {stacks ? `(x${Math.abs(stacks)})` : ''}
      </span>
    </TooltipPlus>
  );
}
