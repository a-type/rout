import {
  Form,
  FormikForm,
  SubmitButton,
  TextField,
} from '@a-type/ui/components/forms';
import { graphql, useMutation } from '@long-game/game-client';

const sendFriendInviteMutation = graphql(`
  mutation SendFriendInvite($input: SendFriendshipInviteInput!) {
    sendFriendshipInvite(input: $input) {
      id
    }
  }
`);

export function SendInvite() {
  const [send] = useMutation(sendFriendInviteMutation);
  return (
    <FormikForm
      initialValues={{ email: '' }}
      onSubmit={async (values) => {
        await send({ variables: { input: { email: values.email } } });
      }}
    >
      <TextField name="email" label="Email" type="email" />
      <SubmitButton>Invite friend</SubmitButton>
    </FormikForm>
  );
}
