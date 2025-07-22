import { sdkHooks } from '@/services/publicSdk.js';
import { Dialog, DialogContent, DialogTitle } from '@a-type/ui';
import { PlayerColorName } from '@long-game/common';
import { EditProfileForm } from './EditProfile.js';

export function CompleteProfileDialog() {
  const { data: me } = sdkHooks.useGetMe();

  const open = !!me && incompleteProfile(me);

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>Complete your profile</DialogTitle>
        <div>Just a few things to start playing</div>

        <EditProfileForm />
      </DialogContent>
    </Dialog>
  );
}

function incompleteProfile(me: {
  displayName: string;
  color: PlayerColorName;
}) {
  return !me.displayName || !me.color;
}
