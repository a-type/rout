import { GameManual } from '@/components/games/GameManual';
import { MainNav } from '@/components/nav/MainNav';
import { Button, Icon, PageContent, PageRoot } from '@a-type/ui';
import { Link, useParams } from '@verdant-web/react-router';

const GameDetailsPage = () => {
  const { gameId } = useParams();
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <Button
          emphasis="ghost"
          className="mr-auto my-md"
          render={<Link to="/library" />}
        >
          <Icon name="arrowLeft" />
          Back to library
        </Button>
        <GameManual gameId={gameId} />
      </PageContent>
    </PageRoot>
  );
};

export default GameDetailsPage;
