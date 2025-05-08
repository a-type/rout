import { clsx } from '@a-type/ui';
import { cardDefinitions } from '@long-game/game-gudnak-definition';
import { RenderCard } from '../card/Card';
import { hooks } from '../gameClient';
import { useBoardOrientation } from '../utils/useBoardOrientation';
import { useViewState } from '../views/useViewState';

export function DiscardZone({
  playerId,
  discard,
  side,
}: {
  playerId: string;
  discard: string[];
  side: 'top' | 'bottom';
}) {
  const { setViewState } = useViewState();
  const orientation = useBoardOrientation();
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
        orientation === 'landscape' ? 'max-w-[17%]' : 'max-w-[28%]',
        side === 'top'
          ? orientation === 'landscape'
            ? 'left-[1%] bottom-[7%] rotate-90'
            : 'left-[6%] top-[1%]'
          : orientation === 'landscape'
          ? 'right-[1%] top-[7%] -rotate-90'
          : 'right-[6%] bottom-[1%]',
      )}
    >
      <RenderCard
        onClick={() => {
          setViewState({ kind: 'discard', playerId });
        }}
        instanceId={discard?.[0] ?? 'no-card'}
        cardData={topCardDef}
        cardId={topCard.cardId}
      />
    </div>
  );
}
