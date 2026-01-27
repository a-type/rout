import { Box, Button, Icon } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface NavigationControlsProps {}

export function NavigationControls({}: NavigationControlsProps) {
  return (
    <Box>
      <Button emphasis="contrast" aria-label="Go home" render={<Link to="/" />}>
        <Icon name="arrowLeft" />
      </Button>
    </Box>
  );
}
