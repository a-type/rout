import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, FormikForm, SubmitButton, TextField } from '@a-type/ui';
import { useState } from 'react';

export function SendInvite() {
  const [showSent, setShowSent] = useState(false);
  const sendMutation = sdkHooks.useSendFriendshipInvite();

  if (showSent) {
    return (
      <Box d="col" surface="primary" p gap>
        Invite sent!
        <Button color="ghost" onClick={() => setShowSent(false)}>
          Invite someone else
        </Button>
      </Box>
    );
  }

  return (
    <Box d="col" surface="primary" p gap>
      <FormikForm
        initialValues={{ email: '' }}
        onSubmit={async (values) => {
          await sendMutation.mutateAsync({ email: values.email });
          setShowSent(true);
        }}
      >
        <TextField name="email" label="Email" type="email" />
        <SubmitButton>Invite someone new</SubmitButton>
      </FormikForm>
    </Box>
  );
}
