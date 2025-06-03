import { clsx } from '@a-type/ui';
import type {
  AttributeType,
  PerkEffect as PerkEffectType,
} from '@long-game/game-wizard-ball-definition';
import { shortAttribute, compositeToString } from '../utils';

export function PerkEffect({ effect }: { effect: PerkEffectType }) {
  return (
    <>
      {Object.entries(effect.attributeBonus ?? {}).map(([key, value]) => {
        return (
          <span
            key={key}
            className={clsx(
              'text-sm uppercase',
              value > 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {value > 0 ? '+' : ''}
            {value} {shortAttribute(key as AttributeType)}
          </span>
        );
      })}
      {Object.entries({
        ...effect.battingCompositeBonus,
        ...effect.pitchingCompositeBonus,
      }).map(([key, value]) => {
        return (
          <span
            key={key}
            className={clsx(
              'text-sm capitalize',
              value > 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {value > 0 ? '+' : ''}
            {value} {compositeToString(key as any)}
          </span>
        );
      })}
    </>
  );
}
