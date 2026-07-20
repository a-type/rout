import { Box, Dialog } from '@a-type/ui';
import { isPrefixedId, PrefixedId } from '@long-game/common';
import {
  PlayerAvatar,
  PlayerFriendChip,
  PlayerName,
  PlayerStatusChip,
  PlayerTurnChip,
  usePlayerThemed,
} from '@long-game/game-ui';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Suspense } from 'react';

export const PlayerModal = () => {
  const { playerId: rawPlayerId } = useSearch({
    strict: false,
  });
  const navigate = useNavigate();

  const playerId =
    rawPlayerId && isPrefixedId(rawPlayerId, 'u')
      ? (rawPlayerId as PrefixedId<'u'>)
      : null;
  const close = () => {
    navigate({
      from: '/',
      search: ({ playerId, ...v }) => v,
    });
  };

  return (
    <Dialog
      open={!!playerId}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      {playerId && <Content playerId={playerId} />}
    </Dialog>
  );
};

function Content({ playerId }: { playerId: PrefixedId<'u'> }) {
  const { className, style } = usePlayerThemed(playerId);
  return (
    <Dialog.Content className={className} style={style}>
      <Suspense>
        <Box col gap items="center">
          <PlayerAvatar playerId={playerId} size="20vmin" />
          <Dialog.Title>
            <PlayerName playerId={playerId} />
          </Dialog.Title>
        </Box>
        <Box gap items="center">
          <PlayerStatusChip playerId={playerId} />
          <PlayerTurnChip playerId={playerId} />
          <PlayerFriendChip playerId={playerId} />
        </Box>
      </Suspense>
    </Dialog.Content>
  );
}
