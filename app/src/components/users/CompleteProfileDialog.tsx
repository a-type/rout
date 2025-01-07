import { publicApiClient } from '@/services/publicApi.js';
import { Dialog, DialogContent, DialogTitle } from '@a-type/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { EditProfileForm } from './EditProfile.jsx';

export function CompleteProfileDialog() {
  const { data: me } = useSuspenseQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await publicApiClient.users.me.$get();
      return await response.json();
    },
  });

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

function incompleteProfile(me: { name: string; color: string | null }) {
  return !me.name || !me.color;
}
