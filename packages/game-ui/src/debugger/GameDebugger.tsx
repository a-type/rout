import {
  ActionBar,
  ActionButton,
  Box,
  Button,
  ButtonProps,
  H1,
  H2,
  Icon,
  IconSpritesheet,
  ScrollArea,
  Spinner,
  Tabs,
} from '@a-type/ui';
import {
  GameSessionSuite,
  useLocalStorage,
  withGame,
} from '@long-game/game-client';
import { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface GameDebuggerProps extends ButtonProps {}

export function GameDebugger({ ...props }: GameDebuggerProps) {
  const [popout, setPopout] = useState<Window | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [showButton] = useLocalStorage(
    'debugEnabled',
    window.location.hostname === 'localhost',
  );

  const showDebugger = () => {
    const newWindow = window.open(
      '',
      'Game Debugger',
      'width=800,height=600,scrollbars=yes,resizable=yes',
    );
    if (newWindow) {
      const root = newWindow.document.createElement('div');
      setRoot(root);
      newWindow.document.body.appendChild(root);

      // Copy the app's styles into the new window
      const stylesheets = Array.from(document.styleSheets);
      stylesheets.forEach((stylesheet) => {
        const css = stylesheet as CSSStyleSheet;
        if (stylesheet.href) {
          const newStyleElement = document.createElement('link');
          newStyleElement.rel = 'stylesheet';
          newStyleElement.href = stylesheet.href;
          newWindow.document.head.appendChild(newStyleElement);
        } else if (css && css.cssRules && css.cssRules.length > 0) {
          const newStyleElement = document.createElement('style');
          Array.from(css.cssRules).forEach((rule) => {
            newStyleElement.appendChild(document.createTextNode(rule.cssText));
          });
          newWindow.document.head.appendChild(newStyleElement);
        }
      });

      newWindow.focus();
      setPopout(newWindow);
    }
  };

  useEffect(() => {
    const remove = () => {
      setRoot(null);
      setPopout(null);
    };
    popout?.addEventListener('beforeunload', remove);
    return () => {
      if (popout) {
        popout.removeEventListener('beforeunload', remove);
        popout.close();
      }
    };
  }, [popout]);

  if (!showButton) return null;

  return (
    <>
      <Button size="icon" onClick={showDebugger} {...props}>
        <Icon name="magic" />
      </Button>
      <Suspense>
        {root && popout && createPortal(<DebuggerUi />, root)}
      </Suspense>
    </>
  );
}

type DebugData = Awaited<ReturnType<GameSessionSuite<any>['debug']>>;
const DebuggerUi = withGame(function DebuggerUi({ gameSuite }) {
  const [debug, setDebug] = useState<DebugData | null>(null);
  useEffect(() => {
    function refresh() {
      console.log('refreshing debug data');
      gameSuite.debug().then(setDebug);
    }
    refresh();
    const unsubs = [
      gameSuite.subscribe('turnPrepared', refresh),
      gameSuite.subscribe('turnPlayed', refresh),
      gameSuite.subscribe('roundChanged', refresh),
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [gameSuite]);

  if (!debug) return <Spinner />;

  return (
    <Box d="col" p gap>
      <IconSpritesheet />
      <H1>Game Debugger</H1>
      <ActionBar>
        <ActionButton onClick={() => debug.resetGame()}>
          <Icon name="warning" />
          Reset Game
        </ActionButton>
      </ActionBar>
      {gameSuite.turnError && (
        <Box surface="attention" d="col" p="sm">
          <H2>Turn Validation Error</H2>
          <pre>{JSON.stringify(gameSuite.turnError, null, 2)}</pre>
        </Box>
      )}
      <Box
        surface="wash"
        d="col"
        className="flex-basis-500px min-h-0 flex-grow-1 flex-shrink-1"
      >
        <H2>Global State</H2>
        <ScrollArea className="min-h-0">
          <pre>{JSON.stringify(debug.globalState, null, 2)}</pre>
        </ScrollArea>
      </Box>
      <Box
        surface="wash"
        d="col"
        className="flex-basis-500px min-h-0 flex-grow-1 flex-shrink-1"
      >
        <H2>Player State</H2>
        <Tabs className="flex flex-col min-h-0 flex-1" defaultValue="final">
          <Tabs.List>
            <Tabs.Trigger value="initial">Initial</Tabs.Trigger>
            <Tabs.Trigger value="final">Final</Tabs.Trigger>
          </Tabs.List>
          <ScrollArea className="min-h-0">
            <Tabs.Content value="initial">
              <pre>{JSON.stringify(debug.initialState, null, 2)}</pre>
            </Tabs.Content>
            <Tabs.Content value="final">
              <pre>{JSON.stringify(debug.finalState, null, 2)}</pre>
            </Tabs.Content>
          </ScrollArea>
        </Tabs>
      </Box>
      <Box
        surface="wash"
        d="col"
        className="flex-basis-500px min-h-0 flex-grow-1 flex-shrink-1"
      >
        <H2>Current Turn</H2>
        <ScrollArea className="min-h-0">
          <pre>{JSON.stringify(debug.currentTurn, null, 2)}</pre>
        </ScrollArea>
      </Box>
    </Box>
  );
});
