import { Box, Button } from '@a-type/ui';
import { DefaultChatMessage } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { PageContent } from './PageContent';
import { useSearchParams } from '@verdant-web/react-router';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export const Client = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return <Gameplay />;
});

export const ChatMessage = DefaultChatMessage;

// perhaps you'll want to move these to other modules.

const Gameplay = hooks.withGame(function Gameplay({ gameSuite }) {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <Box className="flex flex-col gap-2">
      <div className="fixed flex gap-2 bg-gray-800 p-4 w-full z-10 items-center max-h-[4rem]">
        <Button
          onClick={() => {
            gameSuite.submitTurn(gameSuite.localTurnData || {});
          }}
        >
          Next round
        </Button>
        <Button
          onClick={() => {
            gameSuite.submitTurn({});
          }}
        >
          Force round
        </Button>
        {[...searchParams.keys()].length > 0 && (
          <Button
            onClick={() => {
              setSearchParams((params) => {
                params.delete('teamId');
                params.delete('playerId');
                params.delete('gameId');
                return params;
              });
            }}
          >
            Back
          </Button>
        )}
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
