import { Player } from '@long-game/game-wizard-ball-definition';
import { numberToLetter, shortAttribute } from '../utils';

const attributeList: Array<{
  value: keyof Player['attributes'];
  label: string;
  color: string;
}> = [
  { value: 'strength', label: 'Strength', color: '#3B82F6' },
  { value: 'wisdom', label: 'Wisdom', color: '#10B981' },
  { value: 'agility', label: 'Agility', color: '#F59E42' },
  { value: 'intelligence', label: 'Intelligence', color: '#8B5CF6' },
  { value: 'constitution', label: 'Constitution', color: '#EF4444' },
  { value: 'charisma', label: 'Charisma', color: '#F472B6' },
];

export function AttributeSummary({
  attributes,
  attributesModified,
  limit = 6,
}: {
  attributes: Player['attributes'] & { overall: number };
  attributesModified?: Player['attributes'] & { overall: number };
  stamina?: number;
  limit?: number;
}) {
  const baseOverall = attributes.overall;
  const overallMod = attributesModified?.overall ?? 0;
  const overall = baseOverall + overallMod;

  const listWithRatings = attributeList
    .map(({ value, ...rest }) => {
      const baseValue = attributes[value] || 0;
      const modValue = baseValue + (attributesModified?.[value] ?? 0);
      return { rating: modValue, value, ...rest };
    })
    .sort((a, b) => Math.abs(b.rating - 10) - Math.abs(a.rating - 10));
  const finalList = [
    {
      value: 'overall',
      label: 'Overall',
      color: '#F97316',
      rating: overall / 6,
    },
    ...listWithRatings.slice(0, limit),
  ];
  return (
    <div className="flex flex-row gap-6 justify-center items-center">
      {finalList.map(({ value, label, color, rating }) => {
        return (
          <div key={value} className="flex flex-col items-center gap-2">
            <span className="font-bold whitespace-nowrap" style={{ color }}>
              {value === 'overall'
                ? 'OVR'
                : shortAttribute(value as any).toUpperCase()}
            </span>
            <span className="text-2xl font-bold">{numberToLetter(rating)}</span>
          </div>
        );
      })}
    </div>
  );
}
