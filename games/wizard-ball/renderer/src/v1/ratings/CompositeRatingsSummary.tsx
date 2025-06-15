import {
  BattingCompositeRatings,
  PitchingCompositeRatings,
} from '@long-game/game-wizard-ball-definition';
import { battingRatingList, pitchingRatingList } from './CompositeRatings';
import { numberToLetter } from '../utils';
import { TooltipPlus } from '../TooltipPlus';

export function CompositeRatingsSummary({
  compositeRatings,
  compositeMod,
  kind,
  limit = 3,
  hideOther = false,
}: {
  compositeRatings: PitchingCompositeRatings | BattingCompositeRatings;
  compositeMod?: PitchingCompositeRatings | BattingCompositeRatings;
  kind: 'batting' | 'pitching';
  limit?: number;
  hideOther?: boolean;
}) {
  const list = kind === 'batting' ? battingRatingList : pitchingRatingList;
  const listWithRatings = list
    .map(({ value, ...rest }) => {
      /*  @ts-expect-error */
      const baseValue = compositeRatings[value] || 0;
      /*  @ts-expect-error */
      const modValue = baseValue + (compositeMod?.[value] ?? 0);
      return { ...rest, value, rating: modValue };
    })
    .sort((a, b) => Math.abs(b.rating - 10) - Math.abs(a.rating - 10));
  const finalList = [
    ...listWithRatings.slice(0, limit),
    ...(limit && limit < 10 && !hideOther
      ? [
          listWithRatings.slice(limit).reduce(
            (acc, curr) => {
              acc.rating += curr.rating / (listWithRatings.length - limit);
              return acc;
            },
            {
              value: 'average',
              label: 'Other',
              color: '#808080',
              rating: 0,
              tooltip: 'Average of other ratings',
            },
          ),
        ]
      : []),
  ];
  return (
    <div className="flex flex-row gap-4 justify-center items-center">
      {finalList.map(({ value, label, color, rating, tooltip }) => {
        return (
          <TooltipPlus key={value} content={tooltip}>
            <div className="flex flex-col items-center gap-2">
              <span className="font-bold whitespace-nowrap" style={{ color }}>
                {label}
              </span>
              <span className="text-2xl font-bold">
                {numberToLetter(rating)}
              </span>
            </div>
          </TooltipPlus>
        );
      })}
    </div>
  );
}
