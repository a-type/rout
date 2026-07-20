import { GameManual } from '@/components/games/GameManual';
import { MainNav } from '@/components/nav/MainNav';
import { Button, Icon, PageContent, PageRoot } from '@a-type/ui';
import { Link, useParams } from '@tanstack/react-router';

const GameDetailsPage = () => {
  const { gameId } = useParams({
    from: '/library/$gameId',
  });
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <Button emphasis="ghost" align="start" render={<Link to="/library" />}>
          <Icon name="arrowLeft" />
          Back to library
        </Button>
        <GameManual gameId={gameId} />
      </PageContent>
    </PageRoot>
  );
};

export default GameDetailsPage;
