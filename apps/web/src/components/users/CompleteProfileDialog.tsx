import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@a-type/ui/components/dialog';
import { Me, globalHooks } from '@long-game/game-client';
import { EditProfileForm } from './EditProfile.jsx';

export interface CompleteProfileDialogProps {}

export function CompleteProfileDialog({}: CompleteProfileDialogProps) {
  const { data: me } = globalHooks.users.me.useQuery();

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

function incompleteProfile(me: Me) {
  return !me.name || !me.color;
}
