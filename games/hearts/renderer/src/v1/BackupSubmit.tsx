import { SubmitTurn } from '@long-game/game-ui';
import { useEffect, useState } from 'react';
import { hooks } from './gameClient.js';

export interface BackupSubmitProps {}

export const BackupSubmit = hooks.withGame<BackupSubmitProps>(
  function BackupSubmit({ gameSuite }) {
    const rawShow =
      !!gameSuite.localTurnData &&
      !gameSuite.turnWasSubmitted &&
      !gameSuite.turnError &&
      !gameSuite.isTurnSubmitDelayed;

    const [delayedShow, setDelayedShow] = useState(false);
    useEffect(() => {
      if (rawShow) {
        const timeout = setTimeout(() => setDelayedShow(true), 1000);
        return () => clearTimeout(timeout);
      } else {
        setDelayedShow(false);
      }
    }, [rawShow]);

    if (!delayedShow) {
      return null;
    }

    return <SubmitTurn />;
  },
);
