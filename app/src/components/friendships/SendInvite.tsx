import { sdkHooks } from '@/services/publicSdk';
import { FormikForm, SubmitButton, TextField } from '@a-type/ui';

export function SendInvite() {
  const sendMutation = sdkHooks.useSendFriendshipInvite();
  return (
    <FormikForm
      initialValues={{ email: '' }}
      onSubmit={async (values) => {
        await sendMutation.mutateAsync({ email: values.email });
      }}
    >
      <TextField name="email" label="Email" type="email" />
      <SubmitButton>Invite friend</SubmitButton>
    </FormikForm>
  );
}
