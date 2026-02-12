import { Combobox, FieldLabel, FieldRoot } from '@a-type/ui';
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
    <FieldRoot className={className}>
      <FieldLabel htmlFor={id}>Time zone</FieldLabel>
      <TimeZoneCombobox
        id={id}
        value={value ?? null}
        onValueChange={(value) => {
          if (value) onValueChange(value);
        }}
        name="timezone"
        items={[null, ...Intl.supportedValuesOf('timeZone')]}
      >
        <TimeZoneCombobox.Input disableClear name={name} {...rest} />
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
