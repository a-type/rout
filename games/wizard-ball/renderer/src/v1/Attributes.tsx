import { Player } from '@long-game/game-wizard-ball-definition';
import { Fragment } from 'react/jsx-runtime';
import { roundFloat } from './utils';

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
  attributes,
}: {
  attributes: Player['attributes'] & { overall: number };
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="mb-1">Attributes</h2>
      <div className="flex gap-2 items-center">
        <span className="font-semibold">Overall:</span>
        <span>{roundFloat(attributes.overall, 1)}</span>
        <div className="w-full h-3 bg-gray-300 rounded-sm overflow-hidden">
          <div
            className="h-full bg-yellow-500"
            style={{
              width: `${(attributes.overall / 120) * 100}%`,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-x-4 gap-y-2 items-center">
        {attributeList.map(({ value, label, color }) => (
          <Fragment key={value}>
            <span className="font-semibold col-span-2">{label}:</span>
            <span className="col-span-1 text-right">
              {roundFloat(attributes[value], 1)}
            </span>
            <div className="col-span-3 flex items-center">
              <div className="w-full h-3 bg-gray-300 rounded-sm overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    backgroundColor: color,
                    width: `${(attributes[value] / 20) * 100}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
