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
import { TimezoneField } from '../general/TimeZoneField.js';
import { UploadAvatar } from './UploadAvatar.js';

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
        timezone: initial?.timezone ?? null,
      }}
      enableReinitialize
      onSubmit={async (values) => {
        await updateMutation.mutateAsync(values);
        onSave?.();
      }}
    >
      <UploadAvatar />
      <TextField
        required
        name="displayName"
        label="Display name"
        placeholder="What should we call you?"
      />
      <ColorPickerField />
      <TimezoneFieldWrapper />
      <Box justify="end" full="width">
        <SubmitButton>Save</SubmitButton>
      </Box>
    </FormikForm>
  );
}

function ColorPickerField() {
  const [{ value }, _, tools] = useField('color');
  return (
    <Box wrap grow items="center">
      {(Object.keys(colors) as (keyof typeof colors)[]).map((palette) => (
        <Button
          type="button"
          onClick={() => tools.setValue(palette)}
          style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--m-gray-paper)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <span className="sr-only">{palette}</span>
          <Box
            round="sm"
            style={{
              background: colors[palette].default,
              width: value === palette ? '80%' : '50%',
              height: value === palette ? '80%' : '50%',
            }}
          />
        </Button>
      ))}
    </Box>
  );
}

function TimezoneFieldWrapper() {
  const [{ value }, _, tools] = useField('timezone');
  return (
    <TimezoneField
      value={value}
      onValueChange={(value) => {
        if (value) {
          tools.setValue(value);
        }
      }}
      name="timezone"
    />
  );
}
