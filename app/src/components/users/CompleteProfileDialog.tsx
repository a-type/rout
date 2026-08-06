import { sdkHooks } from '@/services/publicSdk.js';
import { Box, Dialog } from '@a-type/ui';
import { PlayerColorName } from '@long-game/common';
import { EditProfileForm } from './EditProfile.js';

export function CompleteProfileDialog() {
  const { data: me } = sdkHooks.useGetMe();

  const open = !!me && incompleteProfile(me);

  return (
    <Dialog open={open}>
      <Dialog.Content>
        <Dialog.Title>Complete your profile</Dialog.Title>
        <Box col gap>
          <div>Just a few things to start playing</div>
          <EditProfileForm />
        </Box>
      </Dialog.Content>
    </Dialog>
  );
}

function incompleteProfile(me: {
  displayName: string;
  color: PlayerColorName;
}) {
  return !me.displayName || !me.color;
}
