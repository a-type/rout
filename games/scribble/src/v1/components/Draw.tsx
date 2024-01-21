import { withGame, useGameClient } from '../gameClient.js';
import { DrawCanvas } from './DrawCanvas.js';

export interface DrawProps {}

export const Draw = withGame(function Draw({}: DrawProps) {
  const client = useGameClient();
  const prompts = client.state?.prompts;

  return (
    <DrawCanvas
      description={prompts?.description ?? '???'}
      describerId={prompts?.describerId ?? ''}
      userId={client.localPlayer.id}
      onChange={(image) =>
        client.submitTurn((prev) => ({
          description: '',
          ...prev,
          illustration: image,
        }))
      }
    />
  );
});
