import { Backdrop } from '../Backdrop';
import { Card } from '../card/Card';
import { hooks } from '../gameClient';
import { useViewState } from './useViewState';

export function CardViewer() {
  const { finalState } = hooks.useGameSuite();
  const { viewState, setViewState } = useViewState();
  if (viewState.kind !== 'cardViewer') {
    return null;
  }
  return (
    <>
      <Backdrop
        onClick={() => {
          setViewState({ kind: 'game' });
        }}
      />
      <div
        // show card over top of game board in the middle of the screen
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-999 w-70% sm:w-60% md:w-50% lg:max-w-40% overflow-hidden p-4 rounded-2xl shadow-2xl shadow-dark"
        style={{ backgroundColor: 'black' }}
      >
        <Card
          disableMotion
          disableTooltip
          noBorder
          disableDrag
          info={finalState.cardState[viewState.cardInstanceId]}
          instanceId={viewState.cardInstanceId}
        />
      </div>
    </>
  );
}
