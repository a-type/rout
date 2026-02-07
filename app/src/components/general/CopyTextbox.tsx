import { Box, BoxProps, Button, Icon, Input, clsx, toast } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface CopyTextboxProps extends BoxProps {
  value: string;
  hideShare?: boolean;
  hideVisit?: boolean;
}

export function CopyTextbox({
  value,
  className,
  hideShare,
  hideVisit,
  ...rest
}: CopyTextboxProps) {
  const isUrl = value.startsWith('http');
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast('Copied!');
  };
  const share = () => {
    navigator.share(isUrl ? { url: value } : { text: value });
  };

  return (
    <Box
      d="row"
      gap="sm"
      items="center"
      className={clsx('w-full', className)}
      {...rest}
    >
      <Input
        disabled
        value={value}
        className="flex-[1_1_0] [font-size:inherit] py-2xs"
        endAccessory={
          <>
            <Button size="small" emphasis="ghost" onClick={copy}>
              <Icon name="copy" />
            </Button>
            {isUrl && !hideVisit && (
              <Button
                size="small"
                emphasis="ghost"
                render={<Link className="color-inherit" newTab to={value} />}
              >
                <Icon name="new_window" />
              </Button>
            )}
            {!hideShare && (
              <Button size="small" onClick={share} emphasis="primary">
                <Icon name="share" />
              </Button>
            )}
          </>
        }
      />
    </Box>
  );
}
