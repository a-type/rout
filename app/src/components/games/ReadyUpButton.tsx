import { AvatarList, Box, clsx, Icon } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar, TopographyButton } from '@long-game/game-ui';
import { ReactNode } from 'react';

export interface ReadyUpButtonProps {
  className?: string;
  insufficientPlayers?: boolean;
  children?: ReactNode;
}

export const ReadyUpButton = withGame<ReadyUpButtonProps>(
  function ReadyUpButton({
    gameSuite,
    className,
    insufficientPlayers,
    children,
  }) {
    const amIReady = gameSuite.readyPlayers.includes(gameSuite.playerId);

    return (
      <div className={`relative ${className}`}>
        <TopographyButton
          disabled={insufficientPlayers || gameSuite.gameId === 'empty'}
          onClick={() => gameSuite.toggleReady()}
          disableTopography={amIReady}
          className="w-full"
          wrapperClassName="justify-between w-full"
        >
          <Box gap>
            <Icon name={insufficientPlayers || amIReady ? 'x' : 'check'} />
            {children ||
              (insufficientPlayers
                ? 'Need more players'
                : amIReady
                  ? 'Ready!'
                  : 'Ready Up!')}
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
      </div>
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
