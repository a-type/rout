import {
  BattingCompositeRatings,
  BattingCompositeType,
  getPitchingCompositeRatings,
  PitchingCompositeRatings,
} from '@long-game/game-wizard-ball-definition';
import { roundFloat } from '../utils';
import { Tooltip } from '@a-type/ui';
import { Bar } from './Bar';

const battingRatingList: Array<{
  value: BattingCompositeType;
  label: string;
  color: string;
  tooltip?: string;
}> = [
  {
    value: 'contact',
    label: 'Contact',
    color: '#1E90FF',
    tooltip: 'Improves chance of making contact with the ball',
  },
  {
    value: 'plateDiscipline',
    label: 'Discipline',
    color: '#32CD32',
    tooltip: 'Improves ability to avoid bad pitches',
  },
  {
    value: 'hitPower',
    label: 'Power',
    color: '#FF8C00',
    tooltip: 'Improves chance of strong hits',
  },
  {
    value: 'stealing',
    label: 'Stealing',
    color: '#8A2BE2',
    tooltip: 'Improves chance and success rate of steals',
  },
  {
    value: 'hitAngle',
    label: 'Hit Angle',
    color: '#FF1493',
    tooltip: 'Improves launch angle of contact',
  },
  {
    value: 'fielding',
    label: 'Fielding',
    color: '#DC143C',
    tooltip: 'Improves defensive plays and fielding ability',
  },
  {
    value: 'extraBases',
    label: 'Extra Bases',
    color: '#20B2AA',
    tooltip: 'Increases chances of hitting doubles and triples',
  },
  {
    value: 'durability',
    label: 'Durability',
    color: '#FFD700',
    tooltip: 'Reduces rate of stamina usage',
  },
  {
    value: 'homeRuns',
    label: 'Home Runs',
    color: '#FF4500',
    tooltip: 'Increases chances of hitting home runs',
  },
  {
    value: 'dueling',
    label: 'Dueling',
    color: '#00CED1',
    tooltip: 'Reduces the performance of the opposite pitcher',
  },
];

const pitchingRatingList: Array<{
  value: keyof ReturnType<typeof getPitchingCompositeRatings>;
  label: string;
  color: string;
  tooltip?: string;
}> = [
  {
    value: 'contact',
    label: 'Contact',
    color: '#1E90FF',
    tooltip: 'Reduces chance of contact by the batter',
  },
  {
    value: 'hitAngle',
    label: 'Hit Angle',
    color: '#32CD32',
    tooltip: 'Weakens the launch angle of contact',
  },
  {
    value: 'velocity',
    label: 'Velocity',
    color: '#FF8C00',
    tooltip: 'Improves pitch speed',
  },
  {
    value: 'strikeout',
    label: 'Strikeout',
    color: '#8A2BE2',
    tooltip: 'Improves pitch quality with more strikes',
  },
  {
    value: 'accuracy',
    label: 'Accuracy',
    color: '#FF1493',
    tooltip: 'Improves pitch accuracy and reduces walks',
  },
  {
    value: 'hitPower',
    label: 'Hit Power',
    color: '#DC143C',
    tooltip: 'Reduces power of hits against the pitcher',
  },
  {
    value: 'movement',
    label: 'Movement',
    color: '#20B2AA',
    tooltip: 'Improves pitch movement',
  },
  {
    value: 'durability',
    label: 'Durability',
    color: '#FFD700',
    tooltip: 'Reduces rate of stamina usage for pitchers',
  },
  {
    value: 'deception',
    label: 'Deception',
    color: '#FF4500',
    tooltip: 'Increases the chance of batters swinging at bad pitches',
  },
  {
    value: 'dueling',
    label: 'Dueling',
    color: '#00CED1',
    tooltip: 'Improves pitch quality',
  },
];

export function CompositeRatings({
  id,
  compositeRatings,
  compositeMod,
  kind,
}: {
  id?: string;
  compositeRatings: PitchingCompositeRatings | BattingCompositeRatings;
  compositeMod?: PitchingCompositeRatings | BattingCompositeRatings;
  kind: 'batting' | 'pitching';
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="mb-1">Composite ratings</h2>
      <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center">
        {(kind === 'batting' ? battingRatingList : pitchingRatingList).map(
          ({ value, label, color, tooltip }) => {
            /*  @ts-expect-error */
            const baseValue = compositeRatings[value] || 0;
            /*  @ts-expect-error */
            const modValue = baseValue + (compositeMod?.[value] ?? 0);
            const minValue = Math.min(baseValue, modValue);
            const maxValue = Math.max(baseValue, modValue);
            const increase = maxValue > baseValue;
            return (
              <Tooltip key={value} content={tooltip}>
                <div className="col-span-6 grid grid-cols-12 p-1">
                  <span className="font-semibold col-span-3">{label}:</span>
                  <span className="col-span-1 text-right">
                    {roundFloat(modValue, 1)}
                  </span>
                  <div className="col-span-8 flex items-center ml-4">
                    <div className="w-full h-3 bg-gray-300 rounded-sm overflow-hidden">
                      <Bar
                        minValue={minValue}
                        maxValue={maxValue}
                        color={color}
                        increase={increase}
                        range={20}
                      />
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          },
        )}
      </div>
    </div>
  );
}
