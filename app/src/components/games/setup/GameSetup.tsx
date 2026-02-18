import { Box, clsx, H1, Tabs } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { useSearchParams } from '@verdant-web/react-router';
import { GameStartingNotice } from '../GameStartingNotice.js';
import { ReadyUpButton } from '../ReadyUpButton.js';
import { GameMembersPage } from './GameMembersPage.js';
import { GameSelectionBanner } from './GameSelectionBanner.js';
import { SelectGamePage } from './SelectGamePage.js';

export interface GameSetupProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const GameSetup = withGame<GameSetupProps>(function GameSetup({
  gameSessionId,
  className,
  gameSuite,
}) {
  const [search, setSearch] = useSearchParams();

  return (
    <Box p d="col" gap grow className={clsx('m-auto max-w-800px', className)}>
      <Box d="col" gap grow>
        <H1 className="text-md font-bold uppercase">Game Setup</H1>
        <Tabs
          className="flex flex-col gap-md items-center"
          onValueChange={(v) =>
            setSearch((cur) => {
              cur.set('tab', v);
              return cur;
            })
          }
          value={search.get('tab') || 'game'}
        >
          <Tabs.List>
            <Tabs.Trigger value="game">Game</Tabs.Trigger>
            <Tabs.Trigger value="players">Players</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="game">
            <SelectGamePage gameSessionId={gameSessionId} />
          </Tabs.Content>
          <Tabs.Content value="players" className="w-full items-stretch gap-md">
            <GameMembersPage gameSessionId={gameSessionId} />
          </Tabs.Content>
        </Tabs>
      </Box>

      <Box className="sticky bottom-sm z-1000" full="width" col gap="sm">
        <GameSelectionBanner gameId={gameSuite.gameId} />
        <ReadyUpButton />
      </Box>

      <GameStartingNotice />
    </Box>
  );
});
