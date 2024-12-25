import { Dialog, DialogContent, DialogTitle } from '@a-type/ui';
import { useSuspenseQuery } from '@long-game/game-client';
import { EditProfileForm } from './EditProfile.jsx';
import { meQuery } from './queries.js';

export function CompleteProfileDialog() {
  const { data } = useSuspenseQuery(meQuery);

  const open = !!data.me && incompleteProfile(data.me);

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

function incompleteProfile(me: { name: string; color: string | null }) {
  return !me.name || !me.color;
}
