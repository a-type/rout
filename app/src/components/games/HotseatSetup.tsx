import { Box, clsx, H1, LiveUpdateTextField, NumberStepper } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { HotseatGameSuite, withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { GamePicker } from './GamePicker';
import { GameStartingNotice } from './GameStartingNotice';
import { ReadyUpButton } from './ReadyUpButton';

export interface HotseatSetupProps {
  gameSessionId: PrefixedId<'gs'>;
  className?: string;
}

export const HotseatSetup = withGame<HotseatSetupProps>(function HotseatSetup({
  gameSuite,
  gameSessionId,
  className,
}) {
  return (
    <Box col p gap grow className={clsx('m-auto max-w-800px', className)}>
      <Box d="col" gap grow>
        <H1>Hotseat Setup</H1>
        <GamePicker
          id="game-picker"
          value={gameSuite.gameId}
          loading={false}
          gameSessionId={gameSessionId}
          sessionCreator={null}
          hotseat
        />
      </Box>
      <HotseatPlayerSetup />
      <ReadyUpButton className="items-center justify-center">
        Start game
      </ReadyUpButton>
      <GameStartingNotice />
    </Box>
  );
});

const HotseatPlayerSetup = withGame(function HotseatPlayerSetup({ gameSuite }) {
  return (
    <Box d="col" gap>
      <NumberStepper
        value={gameSuite.members.length}
        min={gameSuite.gameDefinition.minimumPlayers}
        max={gameSuite.gameDefinition.maximumPlayers}
        onChange={(val) => {
          (gameSuite as HotseatGameSuite<any>).backend.setMemberCount(val);
        }}
      />
      {gameSuite.members.map((player) => (
        <HotseatPlayerEntry key={player.id} playerId={player.id} />
      ))}
    </Box>
  );
});

const HotseatPlayerEntry = withGame<{ playerId: PrefixedId<'u'> }>(
  function HotseatPlayerEntry({ gameSuite, playerId }) {
    const player = gameSuite.getPlayer(playerId);
    return (
      <Box d="row" items="center" gap>
        <PlayerAvatar playerId={playerId} size={40} />
        <LiveUpdateTextField
          value={player.displayName}
          onChange={(name) => {
            (gameSuite as HotseatGameSuite<any>).backend.setPlayerDisplayName(
              playerId,
              name,
            );
          }}
        />
      </Box>
    );
  },
);
