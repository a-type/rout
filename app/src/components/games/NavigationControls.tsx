import { Box, Button, Icon } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface NavigationControlsProps {}

export function NavigationControls({}: NavigationControlsProps) {
  return (
    <Box>
      <Button size="icon" color="contrast" asChild aria-label="Go home">
        <Link to="/">
          <Icon name="arrowLeft" />
        </Link>
      </Button>
    </Box>
  );
}
