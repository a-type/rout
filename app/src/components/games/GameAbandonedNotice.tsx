import { Box, Button, H2, P } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface GameAbandonedNoticeProps {}

export function GameAbandonedNotice({}: GameAbandonedNoticeProps) {
  return (
    <Box
      surface
      color="attention"
      col
      gap
      className="fixed bottom-sm right-sm shadow-lg"
      border
      p
    >
      <H2>Game Abandoned</H2>
      <P>One or more players left mid-game. Sorry, we can't keep playing.</P>
      <Button size="small" className="self-end" render={<Link to="/" />}>
        Go home
      </Button>
    </Box>
  );
}
