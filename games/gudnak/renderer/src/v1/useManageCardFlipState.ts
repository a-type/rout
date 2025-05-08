import { animate } from 'motion';
import { useEffect } from 'react';
import { hooks } from './gameClient';
import { usePrevious } from './utils/usePrevious';

/** Handles animation state for card flipping */
export const useManageCardFlipState = () => {
  const { finalState } = hooks.useGameSuite();
  const visibleCards = Object.keys(finalState.cardState);
  const previousVisibleCards = usePrevious(visibleCards);
  useEffect(() => {
    const difference = visibleCards.filter(
      (card) => !previousVisibleCards?.includes(card),
    );
    if (difference.length > 0) {
      difference.forEach((card) => {
        animate(0, -180, {
          onUpdate: (v) => {
            const el = document.querySelector(
              `[data-card-id="${card}"] [data-id="card-back"]`,
            ) as HTMLElement;
            if (el) {
              el.style.transform = `rotateY(${v}deg)`;
            }
          },
        });
        animate(180, 0, {
          onUpdate: (v) => {
            const el = document.querySelector(
              `[data-card-id="${card}"] [data-id="card-front"]`,
            ) as HTMLElement;
            if (el) {
              el.style.transform = `rotateY(${v}deg)`;
            }
          },
        });
      });
    }
  }, [visibleCards, previousVisibleCards]);
};
