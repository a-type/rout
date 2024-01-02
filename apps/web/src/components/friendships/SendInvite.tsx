import {
  Form,
  FormikForm,
  SubmitButton,
  TextField,
} from '@a-type/ui/components/forms';
import { globalHooks } from '@long-game/game-client';

export interface SendInviteProps {}

export function SendInvite({}: SendInviteProps) {
  const { mutateAsync } =
    globalHooks.friendships.createFriendshipInvite.useMutation();
  return (
    <FormikForm
      initialValues={{ email: '' }}
      onSubmit={async (values) => {
        await mutateAsync({ email: values.email });
      }}
    >
      <TextField name="email" label="Email" type="email" />
      <SubmitButton>Invite friend</SubmitButton>
    </FormikForm>
  );
}
