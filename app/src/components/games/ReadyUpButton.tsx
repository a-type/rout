import { AvatarList, Box, clsx, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar, TopographyButton } from '@long-game/game-ui';
import { ReactNode } from 'react';

export interface ReadyUpButtonProps {
  className?: string;
  children?: ReactNode;
}

export const ReadyUpButton = withGame<ReadyUpButtonProps>(
  function ReadyUpButton({ gameSuite, className, children }) {
    const amIReady = gameSuite.readyPlayers.includes(gameSuite.playerId);
    const insufficientPlayers =
      gameSuite.members.length < gameSuite.gameDefinition.minimumPlayers;
    const tooManyPlayers =
      gameSuite.members.length > gameSuite.gameDefinition.maximumPlayers;
    const noGame = !gameSuite.gameId || gameSuite.gameId === 'empty';
    const cannotStart = insufficientPlayers || tooManyPlayers || noGame;

    return (
      <TopographyButton
        disabled={cannotStart}
        onClick={() => gameSuite.toggleReady()}
        disableTopography={amIReady}
        color={cannotStart ? 'default' : 'primary'}
        className={clsx('w-full', className)}
        wrapperClassName="justify-between w-full"
      >
        <Box gap>
          <Icon name={insufficientPlayers || amIReady ? 'x' : 'check'} />
          {children ||
            (insufficientPlayers
              ? 'Need more players'
              : tooManyPlayers
                ? 'Too many players'
                : noGame
                  ? 'Select a game'
                  : amIReady
                    ? 'Ready!'
                    : 'Ready to play!')}
        </Box>
        <AvatarList count={gameSuite.members.length}>
          {gameSuite.members.map((member, i) => (
            <AvatarList.ItemRoot index={i} key={member.id}>
              <PlayerReadyAvatar
                playerId={member.id}
                ready={gameSuite.readyPlayers.includes(member.id)}
              />
            </AvatarList.ItemRoot>
          ))}
        </AvatarList>
      </TopographyButton>
    );
  },
);

function PlayerReadyAvatar({
  playerId,
  ready,
}: {
  playerId: PrefixedId<'u'>;
  ready: boolean;
}) {
  return (
    <div className={clsx('relative overflow-visible')}>
      <PlayerAvatar playerId={playerId} />
      {ready ? (
        <div
          className={clsx(
            'absolute -top-1 -right-2px rounded-full w-16px h-16px flex items-center justify-center',
            'bg-accent-dark',
          )}
        >
          <Icon name="check" className="w-10px h-10px color-white" />
        </div>
      ) : null}
    </div>
  );
}
