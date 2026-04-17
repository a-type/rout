import { clsx } from '@a-type/ui';
import type {
  AttributeType,
  PerkEffect as PerkEffectType,
} from '../../definition/index';
import { compositeToString, shortAttribute } from '../utils.js';

export function PerkEffect({ effect }: { effect: PerkEffectType }) {
  return (
    <>
      {Object.entries(effect.attributeBonus ?? {}).map(([key, value]) => {
        return (
          <span
            key={key}
            className={clsx(
              'text-sm uppercase',
              value > 0 ? 'color-accent-dark' : 'color-attention-dark',
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
              value > 0 ? 'color-accent-dark' : 'color-attention-dark',
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
