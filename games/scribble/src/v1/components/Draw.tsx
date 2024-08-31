import { withGame, useGameClient } from '../gameClient.js';
import { DrawCanvas } from './DrawCanvas.js';

export interface DrawProps {
  description: string;
  describerId: string;
}

export const Draw = withGame(function Draw({
  describerId,
  description,
}: DrawProps) {
  const client = useGameClient();
  const prompts = client.state?.prompts;

  return (
    <DrawCanvas
      description={description}
      describerId={describerId}
      userId={client.localPlayer.id}
      onChange={(image) =>
        client.submitTurn((prev) => ({
          promptResponses: [],
          description: '',
          ...prev,
          illustration: image,
        }))
      }
    />
  );
});
