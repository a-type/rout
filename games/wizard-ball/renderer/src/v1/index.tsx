import { Box, Button } from '@a-type/ui';
import { DefaultChatMessage } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { PageContent } from './PageContent';
import { BrowserRouter, Link, NavLink, useSearchParams } from 'react-router';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export const Client = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return (
    <BrowserRouter>
      <Gameplay />
    </BrowserRouter>
  );
});

export const ChatMessage = DefaultChatMessage;

// perhaps you'll want to move these to other modules.

const Gameplay = hooks.withGame(function Gameplay({ gameSuite }) {
  const { finalState, playerId, nextRoundCheckAt } = gameSuite;
  const myTeamId = Object.entries(finalState.league.teamLookup).find(
    ([, team]) => team.ownerId === playerId,
  )?.[0];
  return (
    <Box className="flex flex-col gap-2">
      <div className="fixed flex gap-4 bg-gray-800 p-4 w-full z-10 items-center max-h-[4rem]">
        {!nextRoundCheckAt && (
          <Button
            onClick={() => {
              gameSuite.submitTurn();
            }}
          >
            Next round
          </Button>
        )}
        <NavLink
          to={{
            search: '',
          }}
        >
          Home
        </NavLink>
        <NavLink
          to={{
            search: 'league',
          }}
        >
          League
        </NavLink>
        <NavLink
          to={{
            search: `teamId=${myTeamId}`,
          }}
        >
          My Team
        </NavLink>
        {gameSuite.turnError}
      </div>
      <div className="p-4 mt-16">
        <PageContent />
      </div>
    </Box>
  );
});

const GameRecap = hooks.withGame(function GameRecap({ gameSuite }) {
  return <Box>Game over!</Box>;
});
