import { Player } from '@long-game/game-wizard-ball-definition';
import { Fragment } from 'react/jsx-runtime';
import { roundFloat } from '../utils.js';
import { Bar } from './Bar.js';

const attributeList: Array<{
  value: keyof Player['attributes'];
  label: string;
  color: string;
}> = [
  { value: 'strength', label: 'Strength', color: '#3B82F6' }, // blue-500
  { value: 'wisdom', label: 'Wisdom', color: '#10B981' }, // emerald-500
  { value: 'agility', label: 'Agility', color: '#F59E42' }, // orange-400
  { value: 'intelligence', label: 'Intelligence', color: '#8B5CF6' }, // violet-500
  { value: 'constitution', label: 'Constitution', color: '#EF4444' }, // red-500
  { value: 'charisma', label: 'Charisma', color: '#F472B6' }, // pink-400
];

export function Attributes({
  id,
  attributes,
  attributesModified,
  stamina,
}: {
  id?: string;
  attributes: Player['attributes'] & { overall: number };
  attributesModified?: Player['attributes'] & { overall: number };
  stamina?: number;
}) {
  const baseOverall = attributes.overall;
  const overallMod = attributesModified?.overall ?? 0;
  const overall = baseOverall + overallMod;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="mb-1">Attributes</h2>

      <div className="grid grid-cols-6 sm:grid-cols-12  gap-x-4 gap-y-2 items-center">
        <span className="font-semibold col-span-2">Overall:</span>
        <span className="col-span-1 text-right">{roundFloat(overall, 1)}</span>
        <div className="col-span-3 flex items-center">
          <Bar
            minValue={Math.min(baseOverall, overall)}
            maxValue={Math.max(baseOverall, overall)}
            color="#F97316" // orange-500
            increase={overall > baseOverall}
            range={120}
          />
        </div>

        {stamina || stamina === 0 ? (
          <>
            <span className="font-semibold col-span-2">Stamina:</span>
            <span className="col-span-1 text-right">
              {roundFloat(stamina * 100, 0)}%
            </span>
            <div className="col-span-3 w-full h-3 bg-gray-light rounded-sm overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${stamina * 100}%`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </>
        ) : (
          <span className="col-span-6"></span>
        )}

        {attributeList.map(({ value, label, color }) => {
          const baseValue = attributes[value] || 0;
          const modValue = baseValue + (attributesModified?.[value] ?? 0);
          const minValue = Math.min(baseValue, modValue);
          const maxValue = Math.max(baseValue, modValue);
          const increase = maxValue > baseValue;
          return (
            <Fragment key={value}>
              <span className="font-semibold col-span-2">{label}:</span>
              <span className="col-span-1 text-right">
                {roundFloat(modValue, 1)}
              </span>
              <div className="col-span-3 flex items-center">
                <Bar
                  minValue={minValue}
                  maxValue={maxValue}
                  color={color}
                  increase={increase}
                />
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
