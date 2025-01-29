import { Box, Button, Icon } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface NavigationControlsProps {}

export function NavigationControls({}: NavigationControlsProps) {
  return (
    <Box>
      <Button size="small" color="ghost" asChild>
        <Link to="/">
          <Icon name="home" />
          <span className="hidden md:visible">Home</span>
        </Link>
      </Button>
    </Box>
  );
}
