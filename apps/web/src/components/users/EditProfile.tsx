import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@a-type/ui/components/dialog';
import {
  FormikForm,
  SubmitButton,
  TextField,
  useField,
  useValues,
} from '@a-type/ui/components/forms';
import { Me, globalHooks } from '@long-game/game-client';
import { colors, randomItem } from '@long-game/common';
import { Button } from '@a-type/ui/components/button/Button';
import { Icon } from '@a-type/ui/components/icon';
import { useState } from 'react';

export interface EditProfileProps {
  onSave?: () => void;
}

const randomColor = randomItem(Object.keys(colors));

export function EditProfileForm({ onSave }: EditProfileProps) {
  const { data: me, refetch } = globalHooks.users.me.useQuery();
  const { mutateAsync } = globalHooks.users.update.useMutation();

  return (
    <FormikForm
      initialValues={{
        name: me?.name ?? '',
        color: me?.color ?? randomColor,
      }}
      onSubmit={async (values) => {
        await mutateAsync(values);
        await refetch();
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
