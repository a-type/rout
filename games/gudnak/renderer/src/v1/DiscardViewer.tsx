import { clsx } from '@a-type/ui';
import { Backdrop } from './Backdrop';
import { Card } from './Card';
import { hooks } from './gameClient';
import { useViewState } from './useViewState';

export function DiscardViewer() {
  const { finalState } = hooks.useGameSuite();
  const { viewState, setViewState } = useViewState();
  if (viewState.kind !== 'discard') {
    return null;
  }
  const discard = finalState.playerState[viewState.playerId].discard;

  return (
    <>
      <Backdrop
        onClick={() => {
          setViewState({ kind: 'game' });
        }}
      />
      <div
        // show card over top of game board in the middle of the screen
        className={clsx(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'flex flex-row flex-wrap gap-2 bg-dark/80',
          'z-999 w-80% h-80% overflow-y-scroll p-4 rounded-2xl shadow-2xl shadow-dark',
        )}
        style={{ minHeight: 120 }}
      >
        {discard.map((cardInstanceId) => (
          <Card
            className="max-w-300px"
            disableMotion
            disableTooltip
            noBorder
            disableDrag
            info={finalState.cardState[cardInstanceId]}
            instanceId={cardInstanceId}
          />
        ))}
      </div>
    </>
  );
}
