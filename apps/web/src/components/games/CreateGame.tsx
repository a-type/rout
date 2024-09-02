import { Button } from '@a-type/ui/components/button';
import { LongGameError } from '@long-game/common';
import { graphql, useMutation } from '@long-game/game-client';
import { useNavigate } from '@verdant-web/react-router';

const createGameMutation = graphql(`
  mutation CreateGameSession($gameId: ID!) {
    prepareGameSession(input: { gameId: $gameId }) {
      id
    }
  }
`);

export function CreateGame() {
  const [mutate] = useMutation(createGameMutation);

  const navigate = useNavigate();

  const create = async () => {
    const result = await mutate({ variables: { gameId: 'number-guess' } });
    const gameSessionId = result.data?.prepareGameSession?.id;
    if (!gameSessionId) {
      throw new LongGameError(
        LongGameError.Code.Unknown,
        'Failed to create game session',
      );
    }
    navigate(`/session/${gameSessionId}`);
  };

  return <Button onClick={create}>New Game</Button>;
}
