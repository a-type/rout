import { FormikForm, SubmitButton, TextField } from '@a-type/ui';
import { graphql, useMutation } from '@long-game/game-client';

const sendFriendInviteMutation = graphql(`
  mutation SendFriendInvite($input: SendFriendshipInviteInput!) {
    sendFriendshipInvite(input: $input) {
      friendships(input: { status: pending }) {
        id
        connection {
          edges {
            node {
              id
              friend {
                id
                name
                imageUrl
              }
            }
          }
        }
      }
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
