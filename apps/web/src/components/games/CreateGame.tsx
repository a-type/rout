import { Button } from '@a-type/ui/components/button';
import { useCreateGameSession } from '@long-game/game-client';
import { useNavigate } from '@verdant-web/react-router';

export interface CreateGameProps {}

export function CreateGame({}: CreateGameProps) {
  const { mutateAsync } = useCreateGameSession();
  const navigate = useNavigate();

  const create = async () => {
    const result = await mutateAsync({ gameId: 'number-guess' });
    navigate(`/session/${result.id}`);
  };

  return <Button onClick={create}>New Game</Button>;
}
