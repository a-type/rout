import { clsx } from '@a-type/ui';
import { cardDefinitions } from '@long-game/game-gudnak-definition';
import { RenderCard } from '../card/Card';
import { hooks } from '../gameClient';
import { useBoardOrientation } from '../utils/useBoardOrientation';
import { useViewState } from '../views/useViewState';
import { usePlayerThemed } from '@long-game/game-ui';
import { PrefixedId } from '@long-game/common';

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
  const topCardDef = topCard?.cardId ? cardDefinitions[topCard.cardId] : null;
  const { className: playerClassName, style } = usePlayerThemed(
    playerId as PrefixedId<'u'>,
  );

  if (!topCardDef) {
    console.error('Missing card definition for top card:', topCard);
    return null;
  }

  if (discard.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        playerClassName,
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
      style={style}
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
