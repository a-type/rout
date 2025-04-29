import { GameManual } from '@/components/games/GameManual';
import { MainNav } from '@/components/nav/MainNav';
import { Button, Icon, PageContent, PageNav, PageRoot } from '@a-type/ui';
import { Link, useParams } from '@verdant-web/react-router';

const GameDetailsPage = () => {
  const { gameId } = useParams();
  return (
    <PageRoot>
      <PageContent>
        <Button asChild color="ghost" className="mr-auto my-md">
          <Link to="/library">
            <Icon name="arrowLeft" />
            Back to library
          </Link>
        </Button>
        <GameManual gameId={gameId} />
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default GameDetailsPage;
