import { clsx } from '@a-type/ui';
import { statusData, StatusType } from '@long-game/game-wizard-ball-definition';
import { TooltipPlus } from '../TooltipPlus.js';
import { PerkEffect } from '../items/PerkEffect.js';

export function strOrFn(
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
    return <div className="p-2 color-attention-dark">Status not found</div>;
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
      className="bg-gray-wash color-gray-ink"
    >
      <span
        className={clsx(
          'flex flex-row items-center bg-white border-solid border-1',
          'p-1 rounded cursor-pointer hover:bg-gray-wash',
          (kind === 'buff') === stacks > 0 ? 'color-accent' : 'color-attention',
        )}
      >
        {strOrFn(icon, stacks)} {strOrFn(name, stacks)}{' '}
        {stacks ? `(x${Math.abs(stacks)})` : ''}
      </span>
    </TooltipPlus>
  );
}
