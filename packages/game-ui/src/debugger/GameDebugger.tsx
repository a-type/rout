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
  NumberStepper,
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
import { PlayerAvatar } from '../players/PlayerAvatar';
import { PlayerName } from '../players/PlayerName';

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
        <Icon name="bug" />
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
  const [roundIndex, setRoundIndex] = useState(gameSuite.latestRoundIndex);

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

      <Box gap wrap items="center">
        {gameSuite.members.map((member) => (
          <Box key={member.id} d="col" items="center">
            <Suspense>
              <PlayerAvatar playerId={member.id} size="60px" />
              <PlayerName playerId={member.id} />
              <div>{member.id}</div>
            </Suspense>
          </Box>
        ))}
      </Box>

      <Tabs defaultValue="globalState">
        <Tabs.List>
          <Tabs.Trigger value="globalState">Global State</Tabs.Trigger>
          <Tabs.Trigger value="playerState">Player State</Tabs.Trigger>
          <Tabs.Trigger value="currentTurn">Current Turn</Tabs.Trigger>
          <Tabs.Trigger value="rounds">Round History</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="globalState">
          <Box d="col">
            <H2>Global State</H2>
            <pre className="text-xs">
              {JSON.stringify(debug.globalState, null, 2)}
            </pre>
          </Box>
        </Tabs.Content>
        <Tabs.Content value="playerState">
          <Box d="col">
            <H2>Player State</H2>
            <Tabs className="flex flex-col min-h-0 flex-1" defaultValue="final">
              <Tabs.List>
                <Tabs.Trigger value="initial">Initial</Tabs.Trigger>
                <Tabs.Trigger value="final">Final</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="initial">
                <pre className="text-xs">
                  {JSON.stringify(debug.initialState, null, 2)}
                </pre>
              </Tabs.Content>
              <Tabs.Content value="final">
                <pre className="text-xs">
                  {JSON.stringify(debug.finalState, null, 2)}
                </pre>
              </Tabs.Content>
            </Tabs>
          </Box>
        </Tabs.Content>
        <Tabs.Content value="currentTurn">
          <Box d="col">
            <H2>Current Turn</H2>
            {gameSuite.turnError && (
              <Box surface="attention" d="col" p="sm">
                <H2>Turn Validation Error</H2>
                <pre className="text-xs">
                  {JSON.stringify(gameSuite.turnError, null, 2)}
                </pre>
              </Box>
            )}

            <pre>{JSON.stringify(debug.currentTurn, null, 2)}</pre>
          </Box>
        </Tabs.Content>
        <Tabs.Content value="rounds">
          <Box d="col">
            <H2>Round History</H2>
            <NumberStepper
              value={roundIndex}
              onChange={setRoundIndex}
              min={0}
              max={gameSuite.latestRoundIndex}
            />
            <Suspense>
              <RoundDebug roundIndex={roundIndex} />
            </Suspense>
          </Box>
        </Tabs.Content>
      </Tabs>
    </Box>
  );
});

const RoundDebug = withGame<{ roundIndex: number }>(function RoundDebug({
  roundIndex,
  gameSuite,
}) {
  const round = gameSuite.getRound(roundIndex);
  return <pre className="text-xs">{JSON.stringify(round, null, 2)}</pre>;
});
