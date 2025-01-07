import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTrigger,
  FormikForm,
  Icon,
  SubmitButton,
  TextField,
  useField,
} from '@a-type/ui';
import { colors, randomItem } from '@long-game/common';
import { graphql, useMutation, useSuspenseQuery } from '@long-game/game-client';
import { useState } from 'react';
import { meQuery } from './queries.js';

export interface EditProfileProps {
  onSave?: () => void;
}

const updateMe = graphql(`
  mutation UpdateMe($input: UpdateUserInfoInput!) {
    updateUserInfo(input: $input) {
      id
      name
      color
    }
  }
`);

const randomColor = randomItem(Object.keys(colors));

export function EditProfileForm({ onSave }: EditProfileProps) {
  const { data } = useSuspenseQuery(meQuery);
  const initial = data.me;
  const [save] = useMutation(updateMe);

  return (
    <FormikForm
      initialValues={{
        name: initial?.name ?? '',
        color: initial?.color ?? randomColor,
      }}
      enableReinitialize
      onSubmit={async (values) => {
        await save({ variables: { input: values } });
        onSave?.();
      }}
    >
      <TextField required name="name" label="Username" />
      <ColorPickerField />
      <DialogActions>
        <SubmitButton>Save</SubmitButton>
      </DialogActions>
    </FormikForm>
  );
}

function ColorPickerField() {
  const [{ value }, _, tools] = useField('color');
  return (
    <div className="flex flex-row flex-wrap gap-1 items-center">
      {(Object.keys(colors) as (keyof typeof colors)[]).map((palette) => (
        <Button
          type="button"
          size="icon"
          onClick={() => tools.setValue(palette)}
          className="w-6 h-6 p-0 bg-white items-center justify-center"
        >
          <span className="sr-only">{palette}</span>
          <div
            className="rounded-full"
            style={{
              background: colors[palette].default,
              width: value === palette ? '100%' : '50%',
              height: value === palette ? '100%' : '50%',
            }}
          />
        </Button>
      ))}
    </div>
  );
}

export function EditProfileButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <Icon name="gear" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <EditProfileForm onSave={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
