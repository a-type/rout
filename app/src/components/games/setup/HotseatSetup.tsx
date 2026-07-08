import {
  Box,
  H1,
  H2,
  Icon,
  LiveUpdateTextField,
  NumberStepper,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { HotseatGameSuite, withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { GameIcon } from '../GameIcon';
import { GameManualDialog } from '../GameManualDialog';
import { GameTitle } from '../GameTitle';
import { StartGameButton } from './StartGameButton';

export interface HotseatSetupProps {
  className?: string;
}

export const HotseatSetup = withGame<HotseatSetupProps>(function HotseatSetup({
  className,
  gameSuite,
}) {
  return (
    <Box
      col
      p
      gap
      grow
      style={{ margin: 'auto', maxWidth: 800 }}
      className={className}
    >
      <Box col gap grow layout="center center">
        <H1>Hotseat Setup</H1>
        <GameIcon gameId={gameSuite.gameId} style={{ width: 200 }} />
        <H2>
          <GameTitle gameId={gameSuite.gameId} />
        </H2>
        <GameManualDialog>
          <Icon name="book" /> How To Play
        </GameManualDialog>
        <HotseatPlayerSetup />
      </Box>
      <StartGameButton />
    </Box>
  );
});

const HotseatPlayerSetup = withGame(function HotseatPlayerSetup({ gameSuite }) {
  return (
    <Box col gap>
      <H2>Players</H2>
      <NumberStepper
        value={gameSuite.members.length}
        min={gameSuite.gameDefinition.minimumPlayers}
        max={gameSuite.gameDefinition.maximumPlayers}
        onChange={(val) => {
          (gameSuite as HotseatGameSuite<any>).backend.setMemberCount(val);
        }}
        data-testid="hotseat-player-count"
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
      <Box items="center" gap>
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
