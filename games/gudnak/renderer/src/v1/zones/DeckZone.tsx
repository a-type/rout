import { clsx } from '@a-type/ui';
import { RenderCard } from '../card/Card';
import { useBoardOrientation } from '../utils/useBoardOrientation';

export function DeckZone({
  deck,
  side,
}: {
  deck: string[];
  side: 'top' | 'bottom';
}) {
  const orientation = useBoardOrientation();

  if (deck.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'absolute aspect-[1/1] z-10',
        orientation === 'landscape' ? 'max-w[17%]' : 'max-w-[28%]',
        side === 'top'
          ? orientation === 'landscape'
            ? 'left-[1%] top-[37%] rotate-90'
            : 'left-[36%] top-[1%]'
          : orientation === 'landscape'
          ? 'right-[1%] top-[37%] -rotate-90'
          : 'left-[36%] bottom-[1%]',
      )}
    >
      <RenderCard
        instanceId={deck?.[0] ?? 'no-card'}
        cardData={{
          abilities: [],
          name: 'Deck',
          kind: 'fighter',
          faction: 'refractory',
          power: 0,
          traits: [],
        }}
        cardId="solaran-cavalry"
        faceDown
      />

      {deck.length && (
        <div
          className={clsx(
            orientation === 'landscape'
              ? side === 'top'
                ? '-rotate-90'
                : 'rotate-90'
              : 'rotate-0',
            'absolute w-full h-full text-4xl font-semibold',
            'top-0 left-0 flex items-center justify-center text-shadow-lg/30',
          )}
          style={{
            zIndex: 100,
            textShadow:
              '2px 2px 10px rgba(0, 0, 0, .8),-2px -2px 10px rgba(0, 0, 0, .8),2px -2px 10px rgba(0, 0, 0, .8),-2px 2px 10px rgba(0, 0, 0, .8)',
          }}
        >
          {deck.length}
        </div>
      )}
    </div>
  );
}
