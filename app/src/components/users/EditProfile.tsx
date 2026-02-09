import { sdkHooks } from '@/services/publicSdk.js';
import {
  Box,
  Button,
  Combobox,
  FieldLabel,
  FieldRoot,
  FormikForm,
  SubmitButton,
  TextField,
  useField,
} from '@a-type/ui';
import { colors, randomItem } from '@long-game/common';
import { useId } from 'react';
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
      <TimezoneField />
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

const TimeZoneCombobox = Combobox.create<string | null>();

function TimezoneField() {
  const [{ value }, _, tools] = useField('timezone');
  const id = useId();
  return (
    <FieldRoot>
      <FieldLabel htmlFor={id}>Time zone</FieldLabel>
      <TimeZoneCombobox
        id={id}
        value={value ?? null}
        onValueChange={(value) => {
          if (value) {
            tools.setValue(value);
          }
        }}
        name="timezone"
        items={[null, ...Intl.supportedValuesOf('timeZone')]}
      >
        <TimeZoneCombobox.Input />
        <TimeZoneCombobox.Content className="flex flex-col overflow-hidden">
          <TimeZoneCombobox.List>
            {(item) => (
              <TimeZoneCombobox.Item
                value={item}
                disabled={item === null}
                key={item ?? 'null'}
                className="flex flex-col gap-xs items-start shrink-0"
              >
                <div>
                  {item === null ? (
                    <span className="text-gray-dark italic">No time zone</span>
                  ) : (
                    new Date().toLocaleTimeString('en-US', {
                      timeZone: item,
                      timeStyle: 'short',
                    })
                  )}
                </div>
                {item && (
                  <div className="italic text-gray-dark text-sm">
                    {item.replaceAll(/_/g, ' ').replaceAll(/\//g, ' / ')}
                  </div>
                )}
              </TimeZoneCombobox.Item>
            )}
          </TimeZoneCombobox.List>
        </TimeZoneCombobox.Content>
      </TimeZoneCombobox>
    </FieldRoot>
  );
}
