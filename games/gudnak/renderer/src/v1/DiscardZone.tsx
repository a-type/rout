import { clsx } from '@a-type/ui';
import { cardDefinitions } from '@long-game/game-gudnak-definition';
import { useMediaQuery } from '@long-game/game-ui';
import { RenderCard } from './Card';
import { hooks } from './gameClient';

export function DiscardZone({
  discard,
  side,
}: {
  discard: string[];
  side: 'top' | 'bottom';
}) {
  const isLarge = useMediaQuery('(min-width: 1024px)');
  const {
    finalState: { cardState },
  } = hooks.useGameSuite();
  const topCardInstanceId = discard[discard.length - 1];
  const topCard = cardState[topCardInstanceId];
  const topCardDef = topCard?.cardId
    ? cardDefinitions[topCard.cardId]
    : cardDefinitions['solaran-cavalry'];

  if (discard.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'absolute aspect-[1/1] z-10',
        isLarge ? 'max-w-[17%]' : 'max-w-[28%]',
        side === 'top'
          ? isLarge
            ? 'left-[1%] bottom-[7%] rotate-90'
            : 'left-[6%] top-[1%]'
          : isLarge
          ? 'right-[1%] top-[7%] -rotate-90'
          : 'right-[6%] bottom-[1%]',
      )}
    >
      <RenderCard
        instanceId={discard?.[0] ?? 'no-card'}
        cardData={topCardDef}
        cardId={topCard.cardId}
      />
    </div>
  );
}
