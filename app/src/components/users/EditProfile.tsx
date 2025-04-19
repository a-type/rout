import { sdkHooks } from '@/services/publicSdk.js';
import {
  Box,
  Button,
  FormikForm,
  SubmitButton,
  TextField,
  useField,
} from '@a-type/ui';
import { colors, randomItem } from '@long-game/common';

export interface EditProfileProps {
  onSave?: () => void;
}

const randomColor = randomItem(Object.keys(colors));

export function EditProfileForm({ onSave }: EditProfileProps) {
  const { data: initial } = sdkHooks.useGetMe();
  const updateMutation = sdkHooks.useUpdateMe();

  return (
    <FormikForm
      initialValues={{
        displayName: initial?.displayName ?? '',
        color: initial?.color ?? randomColor,
      }}
      enableReinitialize
      onSubmit={async (values) => {
        await updateMutation.mutateAsync(values);
        onSave?.();
      }}
    >
      <TextField
        required
        name="displayName"
        label="Display name"
        placeholder="What should we call you?"
      />
      <ColorPickerField />
      <Box justify="end" className="w-full">
        <SubmitButton>Save</SubmitButton>
      </Box>
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
