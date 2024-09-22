import { hooks } from '../gameClient.js';
import { DrawCanvas } from './DrawCanvas.js';

export interface DrawProps {
  description: string;
  describerId: string;
  onImage: (image: any) => void;
}

export const Draw = function Draw({
  describerId,
  description,
  onImage,
}: DrawProps) {
  const playerId = hooks.usePlayerId();

  return (
    <DrawCanvas
      description={description}
      describerId={describerId}
      playerId={playerId}
      onChange={onImage}
    />
  );
};
