import { Combobox, Field, Text } from '@a-type/ui';
import { useId } from 'react';

const TimeZoneCombobox = Combobox.create<string | null>();

export function TimezoneField({
  value,
  onValueChange,
  className,
  name,
  ...rest
}: {
  value: string | null;
  onValueChange: (value: string) => void;
  className?: string;
  name?: string;
}) {
  const id = useId();
  return (
    <Field id={id} className={className}>
      <Field.Label>Time zone</Field.Label>
      <Field.Control
        render={
          <TimeZoneCombobox
            value={value ?? null}
            onValueChange={(value) => {
              if (value) onValueChange(value);
            }}
            name="timezone"
            items={[null, ...Intl.supportedValuesOf('timeZone')]}
          >
            <TimeZoneCombobox.Input disableClear name={name} {...rest} />
            <TimeZoneCombobox.Content
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'clip',
              }}
            >
              <TimeZoneCombobox.List>
                {(item) => (
                  <TimeZoneCombobox.Item
                    value={item}
                    disabled={item === null}
                    key={item ?? 'null'}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--m-space-xs)',
                      alignItems: 'start',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      {item === null ? (
                        <Text italic dim>
                          No time zone
                        </Text>
                      ) : (
                        new Date().toLocaleTimeString('en-US', {
                          timeZone: item,
                          timeStyle: 'short',
                        })
                      )}
                    </div>
                    {item && (
                      <Text italic dim>
                        {item.replaceAll(/_/g, ' ').replaceAll(/\//g, ' / ')}
                      </Text>
                    )}
                  </TimeZoneCombobox.Item>
                )}
              </TimeZoneCombobox.List>
            </TimeZoneCombobox.Content>
          </TimeZoneCombobox>
        }
      />
    </Field>
  );
}
